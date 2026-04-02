# Refactor: Extract `Orb` Sub-component

**Status:** Aprobat  
**Categorie:** refactor  
**Fi?ier ?inta:** src/components/Ambient.jsx  
**Confidence:** 0.95  
**Data:** 01.04.2026 08:03

## Descriere
Create a dedicated `Orb` component to encapsulate the common structure and styling for the ambient orbs, improving reusability and reducing repetition.

## Motiva?ie
The two ambient orb `div` elements share a significant amount of common styling and structure (e.g., `fixed rounded-full pointer-events-none z-[2]`). Extracting them into a reusable `Orb` component makes the `Ambient` component cleaner, easier to read, and simplifies future modifications or additions of similar orb elements, reducing code duplication.

## Cod sugerat
```python
const Orb = ({ animationClass, size, position, gradientColor }) => (
  <div
    className={`fixed rounded-full pointer-events-none z-[2] ${animationClass}`}
    style={{
      width: size, height: size,
      ...position,
      background: `radial-gradient(circle, ${gradientColor} 0%, transparent 65%)`,
    }}
  />
);

export default function Ambient() {
  return (
    <>
      {/* ... */}
      <Orb
        animationClass="animate-orb1"
        size={560}
        position={{ top: '-14%', right: '-9%' }}
        gradientColor="rgba(201,169,110,0.09)"
      />
      <Orb
        animationClass="animate-orb2"
        size={380}
        position={{ bottom: '-9%', left: '-6%' }}
        gradientColor="rgba(196,120,138,0.065)"
      />
    </>
  );
}
```
