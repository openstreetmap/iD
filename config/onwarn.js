/* eslint-disable no-console */
export default (warning, warn) => {
  // skip certain warnings
  if (warning.code === 'CIRCULAR_DEPENDENCY') return;
  if (warning.code === 'EVAL') return;

  // Use default for everything else

  console.log(warning.code);
  warn(warning);
};
