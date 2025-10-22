export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
  modes: ('edit' | 'animate')[];
}

export interface PromptTemplateCategory {
  category: string;
  templates: PromptTemplate[];
}

export const PROMPT_TEMPLATES: PromptTemplateCategory[] = [
  {
    category: 'Product Photo Enhancement',
    templates: [
      {
        id: 'prod-1',
        title: 'Clean Background',
        description: 'Place the product on a clean, professional background.',
        prompt: 'Place the [subject] on a clean, minimalist background of [color or texture]. Professional studio lighting, sharp focus.',
        modes: ['edit'],
      },
      {
        id: 'prod-2',
        title: 'Lifestyle Scene',
        description: 'Integrate your product into a realistic lifestyle setting.',
        prompt: 'Place the [subject] on a [type of surface, e.g., wooden table] in a [location, e.g., modern kitchen]. Add relevant props like a [prop 1] and a [prop 2]. Natural morning light.',
        modes: ['edit'],
      },
      {
        id: 'prod-3',
        title: 'Dramatic Shadow',
        description: 'Add dramatic, high-contrast lighting and shadows.',
        prompt: 'Change the lighting to be dramatic and high-contrast. Add a long, casting shadow from the [subject]. The background should be dark and moody.',
        modes: ['edit'],
      },
      {
        id: 'prod-4',
        title: 'Floating Effect',
        description: 'Make the product appear to be floating majestically.',
        prompt: 'Make the [subject] float in mid-air against a simple gradient background. Add a subtle shadow underneath to ground it.',
        modes: ['edit'],
      },
    ],
  },
  {
    category: 'Artistic Styles',
    templates: [
      {
        id: 'art-1',
        title: 'Watercolor Painting',
        description: 'Transform the image into a soft watercolor painting.',
        prompt: 'Convert the image into a watercolor painting style. Soft edges, vibrant colors, on a textured paper background.',
        modes: ['edit'],
      },
      {
        id: 'art-2',
        title: 'Cyberpunk Neon',
        description: 'Add a futuristic, neon-drenched cyberpunk aesthetic.',
        prompt: 'Change the style to cyberpunk. Add neon signs, rainy streets, and a futuristic color palette of purples, pinks, and blues.',
        modes: ['edit'],
      },
      {
        id: 'art-3',
        title: 'Vintage Film Look',
        description: 'Give the image a nostalgic, vintage film photo look.',
        prompt: 'Apply a vintage film effect. Desaturated colors, add film grain, light leaks, and a slightly faded look.',
        modes: ['edit'],
      },
      {
        id: 'art-4',
        title: 'Comic Book Art',
        description: 'Redraw the image in a classic comic book art style.',
        prompt: 'Turn the photo into a comic book panel. Bold black outlines, halftone dot patterns for shading, and a limited, punchy color scheme.',
        modes: ['edit'],
      },
    ],
  },
  {
    category: 'Video Storytelling',
    templates: [
      {
        id: 'vid-1',
        title: 'Product Reveal',
        description: 'A slow, dramatic reveal of the subject.',
        prompt: 'Slowly zoom in on the [subject], with shimmering particles gently floating around it. The background fades from dark to light.',
        modes: ['animate'],
      },
      {
        id: 'vid-2',
        title: 'Dynamic Pan',
        description: 'A smooth camera pan across the scene.',
        prompt: 'A smooth, slow pan from left to right, revealing more of the scene. The [subject] should remain the central focus.',
        modes: ['animate'],
      },
      {
        id: 'vid-3',
        title: 'Cinematic Orbit',
        description: 'The camera circles around the subject.',
        prompt: 'A 360-degree slow orbit around the [subject]. Cinematic lighting with a subtle lens flare.',
        modes: ['animate'],
      },
      {
        id: 'vid-4',
        title: 'Stop Motion Effect',
        description: 'Simulate a fun, jittery stop motion animation.',
        prompt: 'Animate the image with a jittery, stop-motion effect. The [subject] slightly shifts and rotates in place.',
        modes: ['animate'],
      },
    ],
  },
];
