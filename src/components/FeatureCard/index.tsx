import { define, defineProps } from '@effuse/core';
import './styles.css';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export const FeatureCard = define({
  props: defineProps<FeatureCardProps>(),
  script: () => ({}),
  template: ({ props }) => (
    <article class="feature-card">
      <div class="flex items-center gap-3 mb-3">
        <img src={props.icon} alt={`${props.title} Icon`} class="w-6 h-6" />
        <h3 class="text-lg font-medium text-white">{props.title}</h3>
      </div>
      <p class="text-zinc-500 text-sm leading-relaxed">{props.description}</p>
    </article>
  ),
});
