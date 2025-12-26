import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { displayId, detectLanguage, printBlock } from './format';

describe('format', () => {
  describe('printBlock', () => {
    const originalLog = console.log;
    let logCalls: string[];

    beforeEach(() => {
      logCalls = [];
      console.log = vi.fn((...args: unknown[]) => {
        logCalls.push(args.join(' '));
      });
    });

    afterEach(() => {
      console.log = originalLog;
    });

    it('prints blank line before and after', () => {
      printBlock('test line');
      expect(logCalls).toEqual(['', 'test line', '']);
    });

    it('prints multiple lines', () => {
      printBlock('line 1', 'line 2', 'line 3');
      expect(logCalls).toEqual(['', 'line 1', 'line 2', 'line 3', '']);
    });

    it('handles empty input', () => {
      printBlock();
      expect(logCalls).toEqual(['', '']);
    });
  });

  describe('displayId', () => {
    it('truncates to 8 characters', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(displayId(uuid)).toBe('550e8400');
    });

    it('handles short IDs', () => {
      expect(displayId('abc')).toBe('abc');
    });
  });

  describe('detectLanguage', () => {
    it('detects from typescript tag', () => {
      expect(detectLanguage(['typescript'], '')).toBe('typescript');
    });

    it('detects from ts shorthand', () => {
      expect(detectLanguage(['ts'], '')).toBe('typescript');
    });

    it('detects from js shorthand', () => {
      expect(detectLanguage(['js'], '')).toBe('javascript');
    });

    it('detects from python tag', () => {
      expect(detectLanguage(['python'], '')).toBe('python');
    });

    it('detects from py shorthand', () => {
      expect(detectLanguage(['py'], '')).toBe('python');
    });

    it('detects typescript from content', () => {
      expect(detectLanguage([], 'interface Foo { name: string }')).toBe('typescript');
    });

    it('detects javascript from content', () => {
      expect(detectLanguage([], 'function foo() { const x = 1; }')).toBe('javascript');
    });

    it('detects python from content', () => {
      expect(detectLanguage([], 'def foo():\n    pass')).toBe('python');
    });

    it('detects bash from shebang', () => {
      expect(detectLanguage([], '#!/bin/bash\necho hello')).toBe('bash');
    });

    it('detects tsx from React import', () => {
      expect(detectLanguage([], 'import React from "react"')).toBe('tsx');
    });

    it('returns empty for unknown', () => {
      expect(detectLanguage([], 'random text')).toBe('');
    });

    it('prioritizes tags over content', () => {
      // Content looks like typescript but tag says python
      expect(detectLanguage(['python'], 'const x: string = ""')).toBe('python');
    });
  });
});
