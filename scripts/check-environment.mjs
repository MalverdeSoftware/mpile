const major = Number(process.versions.node.split('.')[0]);
if (major !== 24) {
  console.error(`Verification uses Node 24 (tested with 24.19.0); found ${process.version}. Switch to Node 24 and try again.`);
  process.exit(1);
}
console.log(`Node ${process.version}; runtime check passed.`);
