import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CAPABILITIES, type Capability, type CapabilityId } from '../../content/capabilities';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTilt } from '../../hooks/useTilt';
import { EASE_OUT } from '../../lib/motion';
import { BrandSpecimen } from './demos/BrandSpecimen';
import { CommerceDemo } from './demos/CommerceDemo';
import { DotField } from './demos/DotField';
import { LayoutShuffle } from './demos/LayoutShuffle';
import { StackPing } from './demos/StackPing';
import { VitalsPanel } from './demos/VitalsPanel';
import './Capabilities.css';

const DEMOS: Record<CapabilityId, () => ReactNode> = {
  web: () => <LayoutShuffle />,
  stack: () => <StackPing />,
  interactive: () => <DotField />,
  commerce: () => <CommerceDemo />,
  brand: () => <BrandSpecimen />,
  performance: () => <VitalsPanel />,
};

function CapabilityCard({ capability, order }: { capability: Capability; order: number }) {
  const ref = useTilt<HTMLElement>({ max: 2.5 });
  return (
    <motion.article
      ref={ref}
      className={`vx-cap vx-cap--${capability.id}`}
      aria-labelledby={`cap-${capability.id}`}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1, ease: EASE_OUT, delay: (order % 3) * 0.08 }}
    >
      <div className="vx-cap__head">
        <span className="vx-cap__index">{capability.index}</span>
        <h3 id={`cap-${capability.id}`} className="vx-cap__title">
          {capability.title}
        </h3>
      </div>
      <div className="vx-cap__demo">{DEMOS[capability.id]()}</div>
      <div className="vx-cap__foot">
        <p className="vx-cap__summary">{capability.summary}</p>
        <ul className="vx-cap__tags" aria-label="Focus areas">
          {capability.tags.map((tag) => (
            <li key={tag} className="vx-tag">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="vx-section vx-capabilities" aria-labelledby="capabilities-title">
      <div className="vx-container">
        <SectionHeader
          index="03"
          label="Capabilities"
          titleId="capabilities-title"
          title={
            <>
              Six disciplines. <span className="vx-serif">One</span> obsession.
            </>
          }
        >
          Every card below is a working demo, not an illustration — reflow a layout, ping our API, ripple a field, fill a bag, generate a palette and
          read this page’s live performance.
        </SectionHeader>
        <div className="vx-caps">
          {CAPABILITIES.map((capability, i) => (
            <CapabilityCard key={capability.id} capability={capability} order={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
