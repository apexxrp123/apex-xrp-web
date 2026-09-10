(() => {
  const TRAILER = /trailer=1/.test(location.search);
  const TIERS = [
    { id: "jungle", name: "Jungle", stakeXrp: 1, bots: 8, map: 3600, biome: "jungle", trees: 22 },
  ];
  console.log("apex-chunk-test", TRAILER, TIERS[0].id);
})();
