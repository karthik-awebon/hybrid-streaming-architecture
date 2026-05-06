import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log info messages', () => {
    logger.info('test message');
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('[INFO] test message'));
  });

  it('should log warn messages', () => {
    logger.warn('test warning');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN] test warning'));
  });

  it('should log error messages', () => {
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[ERROR] test error'));
  });

  it('should include metadata in logs', () => {
    const meta = { userId: 123 };
    logger.info('message with meta', meta);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] message with meta'),
      meta
    );
  });

  it('should log debug messages when in development', () => {
    // Note: Since currentLogLevel is determined at module load time,
    // testing environment changes might be tricky without re-importing.
    // In our test environment, it should default to 'debug'.
    logger.debug('test debug');
    expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] test debug'));
  });
});
