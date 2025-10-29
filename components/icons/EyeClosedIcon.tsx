import * as React from 'react';
const EyeClosedIcon = ({ className = '', style = {} }: { className?: string, style?: React.CSSProperties }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M19.5 16L17.0248 12.6038" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 17.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 16L6.96895 12.6124" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 8C6.6 16 17.4 16 21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export default EyeClosedIcon;
