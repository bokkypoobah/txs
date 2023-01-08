const routes = [{
    path: '/config',
    component: Config,
    name: 'Config',
  }, {
    path: '/account',
    component: Account,
    name: 'Account',
  }, {
    path: '/accounts',
    component: Accounts,
    name: 'Accounts',
  }, {
    path: '/report/:contractOrTxOrBlockRange?',
    component: Report,
    name: 'Report',
    props: true,
  }, {
    path: '/transactions',
    component: Transactions,
    name: 'Transactions',
  }, {
    path: '/data',
    component: Data,
    name: 'Data',
  // }, {
  //   path: '/docs/:section/:topic',
  //   component: Docs,
  //   name: 'Docs',
  }, {
    path: '*',
    component: Welcome,
    name: ''
  }
];
