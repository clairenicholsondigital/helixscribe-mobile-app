import { prettyJson } from '@/lib/utils';

export const schedulePresets = {
  disabled: {
    type: 'disabled',
    enabled: false,
    timezone: 'UTC',
    max_retries: 2,
    retry_delay_seconds: 60
  },
  once: {
    type: 'once',
    enabled: true,
    timezone: 'UTC',
    run_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    max_retries: 2,
    retry_delay_seconds: 60
  },
  intervalHourly: {
    type: 'interval',
    enabled: true,
    timezone: 'UTC',
    interval_seconds: 3600,
    max_retries: 2,
    retry_delay_seconds: 60
  },
  cronDailyUtc: {
    type: 'cron',
    enabled: true,
    timezone: 'UTC',
    cron: '0 9 * * *',
    max_retries: 2,
    retry_delay_seconds: 60
  }
};

export const schedulePresetOptions = [
  { key: 'disabled', label: 'Disabled' },
  { key: 'once', label: 'One-off' },
  { key: 'intervalHourly', label: 'Hourly' },
  { key: 'cronDailyUtc', label: 'Daily cron' }
] as const;

export function makeSchedulePresetText(
  preset: keyof typeof schedulePresets = 'disabled'
): string {
  return prettyJson(schedulePresets[preset]);
}
