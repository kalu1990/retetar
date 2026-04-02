# Centralize Orb Configuration Data

**Status:** Aprobat  
**Categorie:** refactor  
**Fi?ier ?inta:** src/components/Ambient.jsx  
**Confidence:** 0.95  
**Data:** 01.04.2026 08:04

## Descriere
Define orb properties (size, position, color, animation) as an array of data outside the component to enhance maintainability and simplify updates.

## Motiva?ie
Hardcoding orb-specific properties directly within JSX makes it cumbersome to manage or modify multiple orbs. Centralizing this data into an array of objects improves readability, makes the component's intent clearer, and allows for easier iteration or dynamic rendering of orbs. This also provides a single source of truth for orb configurations.

## Cod sugerat
```python
const ORB_CONFIGS = [
  { id: 'orb1', animationClass: 'animate-orb1', size: 560, position: { top: '-14%', right: '-9%' }, gradientColor: 'rgba(201,169,110,0.09)' },
  { id: 'orb2', animationClass: 'animate-orb2', size: 380, position: { bottom: '-9%', left: '-6%' }, gradientColor: 'rgba(196,120,138,0.065)' },
];

export default function Ambient() {
  return (
    <>
      {/* ... */}
      {ORB_CONFIGS.map(orb => (
        <div
          key={orb.id}
          className={`fixed rounded-full pointer-events-none z-[2] ${orb.animationClass}`}
          style={{
            width: orb.size, height: orb.size, ...orb.position,
            background: `radial-gradient(circle, ${orb.gradientColor} 0%, transparent 65%)`,
          }}
        />
      ))}
    </>
  );
}
```
