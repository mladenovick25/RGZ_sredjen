import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import keycloak from './components/keycloak'; // Import Keycloak instance

const router = createRouter({
  history: createWebHistory('/app'),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HelloWorld,
      meta: {
        requiresAuth: true
      }
    },
    // other routes...
  ]
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!keycloak.authenticated) {
      keycloak.login()
    } else {
      next()
    }
  } else {
    next()
  }
})

const app = createApp(App);

keycloak.init({ onLoad: 'login-required' })
  .then(authenticated => {
    if (!authenticated) {
      window.location.reload();
    } else {
      console.log('Authenticated');

      // Add Keycloak to Vue instance properties
      app.config.globalProperties.$keycloak = keycloak;

      // Router guard to protect routes
      router.beforeEach((to, from, next) => {
        if (to.meta.requiresAuth && !keycloak.authenticated) {
          keycloak.login();
        } else {
          next();
        }
      });

      app.use(router);
      app.mount('#app');
    }
  })
  .catch(error => {
    console.error('Authentication Failed', error); // Log the error
  });







/*const app = createApp(App);
app.use(router);
app.mount('#app');*/








  
/*keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
  if (authenticated) {
    const app = createApp(App)
    app.use(router)
    app.mount('#app')
  } else {
    window.location.reload()
  }

  // Token refresh
  setInterval(() => {
    keycloak.updateToken(70).then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed')
      } else {
        console.warn('Token not refreshed, valid for '
          + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds')
      }
    }).catch(() => {
      console.error('Failed to refresh token')
    })
  }, 60000)
}).catch(() => {
  console.error('Authentication Failed')
})*/