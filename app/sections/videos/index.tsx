import type { HydrogenComponent } from '@weaverse/hydrogen';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { Section, type SectionProps, sectionInspector } from '~/components/section';

interface VideosProps extends SectionProps {
  children?: ReactNode;
}

let Videos = forwardRef<HTMLElement, VideosProps>((props, ref) => {
  let { children, ...rest } = props;

  return (
    <Section ref={ref} {...rest}>
        {children}
    </Section>
  );
});

export let schema: HydrogenComponent['schema'] = {
  title: 'Videos',
  type: 'videos',
  inspector: sectionInspector,
  childTypes: ['heading', 'video--items'],
  presets: {
    children: [
      {
        type: 'heading',
        content: 'VIDEOS',
      },
      {
        type: 'video--items',
      },
    ],
  },
  toolbar: ['general-settings', ['duplicate', 'delete']],
};

Videos.displayName = 'Videos';
export default Videos; 