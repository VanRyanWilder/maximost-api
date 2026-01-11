export interface LibraryHabit {
  slug: string;
  title: string;
  category: string; // 'bio_rig', 'kinetic_core', etc.
  type: 'metric' | 'duration' | 'boolean';
  target_value: number;
  unit: string;
  metadata: {
    visuals: {
      icon: string; // e.g., 'Footprints', 'Sun'
      theme: string; // e.g., 'bio_emerald'
      is_ring?: boolean;
    };
    compiler: {
      atom: string;
      step: string;
      why: string;
      expert?: string;
      canon_ref?: string;
    };
    telemetry?: {
      auto_verify: boolean;
      terra_metric?: string;
      window?: string;
    };
  };
}

export interface LibraryProtocol {
    stack_id: string;
    title: string;
    description: string;
    habits: string[];
    theme?: string;
    expert?: string;
}
