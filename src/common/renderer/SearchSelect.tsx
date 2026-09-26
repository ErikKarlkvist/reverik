import {
  type JSX,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { filterOptions } from '@/common/model/search';
import { Icon } from './Icon';

interface Props {
  options: readonly string[];
  value: string | null;
  onSelect: (value: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  /** Visas i listan när inget matchar */
  emptyText: string;
}

/**
 * Sökbar väljare: fältet visar valet, skrivning filtrerar listan under.
 * Piltangenter flyttar, Enter väljer, Escape stänger utan att ändra.
 */
export function SearchSelect({
  options,
  value,
  onSelect,
  placeholder,
  label,
  disabled = false,
  emptyText,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const matches = useMemo(() => filterOptions(options, query), [options, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);
  const choose = useCallback(
    (option: string) => {
      close();
      if (option !== value) onSelect(option);
    },
    [close, onSelect, value],
  );

  // Stäng vid klick utanför
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (root.current && !root.current.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(0, matches.length - 1)));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        break;
      case 'Enter': {
        event.preventDefault();
        const option = matches[cursor];
        if (option) choose(option);
        break;
      }
      case 'Escape':
        close();
        input.current?.blur();
        break;
    }
  };

  const active = Math.min(cursor, Math.max(0, matches.length - 1));

  return (
    <div className={`search-select${open ? ' is-open' : ''}`} ref={root}>
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className="search-select__input"
        disabled={disabled}
        placeholder={value ?? placeholder}
        value={open ? query : (value ?? '')}
        onFocus={() => {
          setOpen(true);
          setCursor(0);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <span className="search-select__chevron">
        <Icon name="chevronDown" size="sm" />
      </span>
      {open && (
        <ul id={listId} role="listbox" className="search-select__list">
          {matches.length === 0 && <li className="search-select__empty">{emptyText}</li>}
          {matches.map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              className={`search-select__option${i === active ? ' is-active' : ''}${option === value ? ' is-selected' : ''}`}
              onMouseEnter={() => {
                setCursor(i);
              }}
              onMouseDown={(event) => {
                // mousedown i stället för click så fältets blur inte hinner stänga listan
                event.preventDefault();
                choose(option);
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
