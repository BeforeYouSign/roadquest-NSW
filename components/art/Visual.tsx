'use client';
import type { VisualSpec } from '@/lib/types';
import { SignArt } from './Sign';
import { TrafficLightsArt } from './TrafficLights';
import { Scene, type SceneInteraction } from './Scene';
import { Pov } from './Pov';
import { CustomArt } from './CustomArt';

interface Props {
  spec: VisualSpec | null;
  className?: string;
  interaction?: SceneInteraction;
  teach?: boolean;
  reducedMotion?: boolean;
  hazardMode?: boolean;
  onHazard?: (i: number) => void;
  found?: number[];
}

/** Picks the right renderer for a question's visual spec. */
export function Visual({ spec, className, interaction, teach, reducedMotion, hazardMode, onHazard, found }: Props) {
  if (!spec) return null;
  switch (spec.kind) {
    case 'sign':
      return <SignArt id={spec.sign ?? ''} className={className} />;
    case 'lights':
      return <TrafficLightsArt cols={spec.cols ?? [['red', 'off', 'off']]} sign={spec.sign} className={className} />;
    case 'scene':
      return <Scene spec={spec} className={className} interaction={interaction} teach={teach} reducedMotion={reducedMotion} />;
    case 'pov':
      return <Pov spec={spec} className={className} hazardMode={hazardMode} onHazard={onHazard} found={found} />;
    case 'custom':
      return <CustomArt spec={spec} className={className} interaction={interaction} />;
    default:
      return null;
  }
}

export function visualCaption(spec: VisualSpec | null): string | undefined {
  if (!spec) return undefined;
  return spec.caption;
}
