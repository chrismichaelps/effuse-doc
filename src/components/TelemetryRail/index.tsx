import { define } from '@effuse/core';
import './styles.css';

interface TelemetryRailProps {
  start: string;
  middle: string;
  end: string;
  className?: string;
}

export const TelemetryRail = define<TelemetryRailProps, Record<string, never>>({
  script: () => ({}),
  template: ({ props: { start, middle, end, className } }) => (
    <div
      class={`telemetry-rail${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <span class="telemetry-rail-label">{start}</span>
      <span class="telemetry-rail-trace"></span>
      <span class="telemetry-rail-label telemetry-rail-label--middle">
        {middle}
      </span>
      <span class="telemetry-rail-trace telemetry-rail-trace--delayed"></span>
      <span class="telemetry-rail-label telemetry-rail-label--end">{end}</span>
    </div>
  ),
});
