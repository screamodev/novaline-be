export default {
  routes: [
    {
      method: 'GET',
      path: '/coverage',
      handler: 'coverage.tree',
      config: { policies: [] },
    },
  ],
};
