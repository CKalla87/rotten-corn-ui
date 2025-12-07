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
  let decoded = textarea.value;
  return decoded;
};

// Function to clean HTML by removing quotes and decoding entities
const cleanHtmlContent = (html: string): string => {
  if (!html) return '';
  let cleaned = html;
  
  // First decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  // Remove escaped quotes (like \")
  cleaned = cleaned.replace(/\\"/g, '');
  cleaned = cleaned.replace(/\\'/g, '');
  
  // Remove HTML entity quotes
  cleaned = cleaned.replace(/&quot;/g, '');
  cleaned = cleaned.replace(/&apos;/g, '');
  cleaned = cleaned.replace(/&#34;/g, '');
  cleaned = cleaned.replace(/&#39;/g, '');
  cleaned = cleaned.replace(/&#x22;/gi, '');
  cleaned = cleaned.replace(/&#x27;/gi, '');
  
  // Remove surrounding quotes if they exist
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');
  
  // Remove any remaining quote pairs like ""
  cleaned = cleaned.replace(/"\s*"/g, ' ');
  cleaned = cleaned.replace(/''/g, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
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

  useEffect(() => {
    if (ref.current && html !== undefined) {
      const cleanedHtml = cleanHtmlContent(html);
      // Always update to ensure cleaned content is displayed
      if (ref.current.textContent !== cleanedHtml || ref.current.innerHTML.includes('&quot;') || ref.current.innerHTML.includes('\\"')) {
        ref.current.textContent = cleanedHtml;
      }
    }
  }, [html]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const value = (e.currentTarget as HTMLElement).textContent || '';
    onChange?.({ target: { value } });
  };

  const Tag = tagName as keyof JSX.IntrinsicElements;

  return (
    <Tag
      ref={ref as any}
      contentEditable={!disabled}
      onInput={handleInput}
      className={className}
      style={style}
      data-testid={dataTestId}
      data-placeholder={dataPlaceholder}
      suppressContentEditableWarning
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

