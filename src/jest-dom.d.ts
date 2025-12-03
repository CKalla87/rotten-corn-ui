import '@testing-library/jest-dom';

// Extend Jest matchers with jest-dom matchers for @jest/globals
declare module '@jest/expect' {
  interface Matchers<R = void> {
    toBeInTheDocument(): R;
    toBeEnabled(): R;
    toBeDisabled(): R;
    toBeChecked(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveClass(...classNames: string[]): R;
    toHaveStyle(css: string | Record<string, string | number>): R;
    toBeFalsy(): R;
    toBeTruthy(): R;
    toBeGreaterThan(number: number): R;
    toHaveAttribute(attr: string, value?: string): R;
  }
}
