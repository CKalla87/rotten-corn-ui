import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

interface ContentEditableProps {
  html?: string;
  onChange?: (event: { target: { value: string } }) => void;
  tagName?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  'data-testid'?: string;
  'data-placeholder'?: string;
}

// Function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  const decoded = textarea.value;
  return decoded;
};

// Function to clean HTML by removing quotes and decoding entities
const cleanHtmlContent = (html: string): string => {
  if (!html) return '';
  let cleaned = html;
  
  // First decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  // Remove HTML entity quotes
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&apos;/g, "'");
  cleaned = cleaned.replace(/&#34;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&#x22;/gi, '"');
  cleaned = cleaned.replace(/&#x27;/gi, "'");
  
  // Handle multiple levels of JSON escaping (\\\" becomes ", \\\\\" becomes ", etc.)
  // Keep unescaping until no more escaped quotes/backslashes remain
  let previousCleaned = '';
  while (cleaned !== previousCleaned) {
    previousCleaned = cleaned;
    // Unescape backslashes and quotes
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\'/g, "'");
    cleaned = cleaned.replace(/\\\\/g, '\\');
  }
  
  // Remove surrounding quotes if the entire string is wrapped in quotes (after unescaping)
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove any remaining quote pairs at the start/end
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');
  
  return cleaned.trim();
};

const ContentEditable = ({
  html,
  onChange,
  tagName = 'div',
  className,
  disabled,
  style,
  'data-testid': dataTestId,
  'data-placeholder': dataPlaceholder
}: ContentEditableProps) => {
  const ref = useRef<HTMLElement>(null);
  const isEditingRef = useRef(false);
  const lastHtmlRef = useRef<string | undefined>(undefined);
  const isFocusedRef = useRef(false);

  const prevDisabledRef = useRef(disabled);
  
  useEffect(() => {
    // When disabled becomes true (entering view mode), reset editing/focus refs
    if (disabled && !prevDisabledRef.current) {
      // Just became disabled - reset everything to allow updates
      isEditingRef.current = false;
      isFocusedRef.current = false;
      lastHtmlRef.current = undefined;
    }
    
    // When disabled becomes false (entering edit mode), reset refs to allow editing
    if (!disabled && prevDisabledRef.current) {
      // Just became enabled - allow editing
      isEditingRef.current = false;
      isFocusedRef.current = false;
      // Set lastHtmlRef to current content to prevent immediate overwrite
      if (ref.current) {
        const currentContent = ref.current.textContent || '';
        lastHtmlRef.current = currentContent || html || '';
        // Only update if we have html prop and current content is empty
        if (html && !currentContent.trim()) {
          const cleanedHtml = cleanHtmlContent(html);
          ref.current.textContent = cleanedHtml;
          lastHtmlRef.current = cleanedHtml;
        }
      }
    }
    
    prevDisabledRef.current = disabled;
    
    // Update content when in view mode (disabled) or when html prop changes
    if (ref.current && html !== undefined) {
      // In view mode (disabled), always allow updates
      if (disabled) {
        const cleanedHtml = cleanHtmlContent(html);
        const currentText = ref.current.textContent || '';
        
        // Update if html prop changed or if content is different
        if (lastHtmlRef.current !== html || currentText !== cleanedHtml) {
          ref.current.textContent = cleanedHtml;
          lastHtmlRef.current = html;
        }
      } else {
        // In edit mode, only update if not currently editing/focused AND html prop actually changed from external source
        // Don't update if user is actively editing
        if (!isEditingRef.current && !isFocusedRef.current) {
          // Only update if html prop changed from an external source (not from user input)
          if (lastHtmlRef.current !== html && html !== undefined) {
            const cleanedHtml = cleanHtmlContent(html);
            // Only update if the cleaned html is different from current content
            const currentText = ref.current.textContent || '';
            if (currentText !== cleanedHtml) {
              ref.current.textContent = cleanedHtml;
              lastHtmlRef.current = html;
            }
          }
        }
      }
    }
  }, [html, disabled]);

  // Set initial content on mount
  useEffect(() => {
    if (ref.current && html !== undefined) {
      const cleanedHtml = cleanHtmlContent(html);
      if (!ref.current.textContent || ref.current.textContent.trim() === '') {
        ref.current.textContent = cleanedHtml;
      }
      lastHtmlRef.current = html;
    }
  }, []);

  // Ensure contentEditable attribute is properly set when disabled changes
  useEffect(() => {
    if (ref.current) {
      // Force update contentEditable attribute to ensure it's properly set
      // Use setTimeout to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (ref.current) {
          if (disabled) {
            ref.current.contentEditable = 'false';
            ref.current.setAttribute('contenteditable', 'false');
            ref.current.style.pointerEvents = 'none';
            ref.current.style.userSelect = 'none';
            ref.current.style.cursor = 'default';
          } else {
            ref.current.contentEditable = 'true';
            ref.current.setAttribute('contenteditable', 'true');
            // Ensure the element can receive focus and is editable
            ref.current.removeAttribute('readonly');
            ref.current.removeAttribute('disabled');
            ref.current.style.pointerEvents = 'auto';
            ref.current.style.userSelect = 'text';
            ref.current.style.cursor = 'text';
            // Force a reflow to ensure the attribute is applied
            void ref.current.offsetHeight;
          }
        }
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [disabled]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    // Check both disabled prop and actual contentEditable attribute
    if (disabled || (ref.current && ref.current.contentEditable === 'false')) {
      return; // Don't handle input if disabled
    }
    isEditingRef.current = true;
    const value = (e.currentTarget as HTMLElement).textContent || '';
    // Update the lastHtmlRef to prevent useEffect from overwriting user input
    lastHtmlRef.current = value;
    onChange?.({ target: { value } });
  };

  const handleFocus = () => {
    if (disabled) return; // Don't handle focus if disabled
    isEditingRef.current = true;
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    isEditingRef.current = false;
    isFocusedRef.current = false;
    // Update lastHtmlRef with current content after blur
    if (ref.current) {
      lastHtmlRef.current = ref.current.textContent || '';
    }
  };

  const Tag = tagName as 'div' | 'span' | 'p';

  // Use a ref to track if we need to force update contentEditable
  const contentEditableValue = !disabled;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable={contentEditableValue}
      onInput={handleInput as React.FormEventHandler<HTMLElement>}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      style={{ 
        color: 'var(--black-1)', 
        ...style,
        ...(disabled ? {} : {
          cursor: 'text',
          pointerEvents: 'auto',
          userSelect: 'text'
        })
      }}
      data-testid={dataTestId}
      data-placeholder={dataPlaceholder}
      suppressContentEditableWarning
      tabIndex={!disabled ? 0 : -1}
    />
  );
};

ContentEditable.propTypes = {
  html: PropTypes.string,
  onChange: PropTypes.func,
  tagName: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  'data-testid': PropTypes.string,
  'data-placeholder': PropTypes.string
};

export default ContentEditable;

