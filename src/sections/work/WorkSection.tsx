import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FlaskConical } from 'lucide-react';
import { PROJECTS, PROJECT_GROUPS, type ProjectGroup, type ProjectId } from '../../content/projects';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Segmented } from '../../components/ui/Segmented';
import { ProjectCard, type CardSpan } from './ProjectCard';
import { ProjectOverlay } from './ProjectOverlay';
import { useProjectRoute } from './useProjectRoute';
import './Work.css';

function spanFor(index: number, count: number): CardSpan {
  if (count === 1) return 'full';
  if (count === 2) return index === 0 ? 'wide' : 'narrow';
  if (count === 3) return index === 2 ? 'full' : index === 0 ? 'wide' : 'narrow';
  return index === 0 || index === 3 ? 'wide' : 'narrow';
}

export function WorkSection() {
  const [filter, setFilter] = useState<'all' | ProjectGroup>('all');
  const { openId, open, navigate, close } = useProjectRoute();
  const visible = PROJECTS.filter((p) => filter === 'all' || p.group === filter);

  const getOriginRect = useCallback((id: ProjectId) => {
    const el = document.querySelector<HTMLElement>(`[data-project-card="${id}"] .vx-pcard__media`);
    return el ? el.getBoundingClientRect() : null;
  }, []);

  const options = PROJECT_GROUPS.map((group) => ({
    ...group,
    label: `${group.label} ${group.value === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.group === group.value).length}`,
  }));

  return (
    <section id="work" className="vx-section vx-work" aria-labelledby="work-title">
      <div className="vx-container">
        <SectionHeader
          index="02"
          label="Selected concepts"
          titleId="work-title"
          title={
            <>
              Concepts built to <span className="vx-serif">provoke</span>.
            </>
          }
          aside={
            <span className="vx-notice">
              <FlaskConical size={13} aria-hidden="true" /> Fictional concept projects — not client work
            </span>
          }
        >
          Four self-initiated explorations, each with its own identity, product logic and motion language — built to show range, not to claim clients.
        </SectionHeader>

        <div className="vx-work__toolbar">
          <Segmented options={options} value={filter} onChange={setFilter} layoutId="work-filter" label="Filter concepts by type" controls="work-grid" />
          <p className="vx-work__count" aria-live="polite">
            Showing <strong>{visible.length}</strong> of {PROJECTS.length}
          </p>
        </div>

        <motion.ul id="work-grid" className="vx-work__grid" layout>
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                order={index}
                span={spanFor(index, visible.length)}
                offset={visible.length === 4 && (index === 1 || index === 3)}
                onOpen={() => open(project.id)}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>

      <ProjectOverlay openId={openId} onClose={close} onNavigate={navigate} getOriginRect={getOriginRect} />
    </section>
  );
}
