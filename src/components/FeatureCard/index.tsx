import { define } from '@effuse/core';
import './styles.css';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export const FeatureCard = define<FeatureCardProps, Record<string, never>>({
  script: () => ({}),
  template: ({ props: { icon, title, description } }) => (
    <article class="feature-card">
      <div class="flex items-center gap-3 mb-3">
        <img src={icon} alt={`${title} Icon`} class="w-6 h-6" />
        <h3 class="text-lg font-medium text-white">{title}</h3>
      </div>
      <p class="text-gray-300 text-sm leading-relaxed">{description}</p>
    </article>
  ),
});
