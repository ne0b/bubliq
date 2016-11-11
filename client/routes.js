angular.module('bubliq').config(function($urlRouterProvider, $stateProvider, $locationProvider){

    $locationProvider.html5Mode(true);

    $stateProvider
      .state('index', { // Заглавная страница сайта
        url: '/',
        views: {
          "mainView": {
            templateUrl: 'client/welcome.html',
            controller: 'IndexCtrl',
            controllerAs: 'indexCtrl'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if(user.profile.rulesAccepted && user.emails[0]['verified']){
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                return "EMAILNOTVERIFIED";
              } else {
                return "RULESNOTACCEPTED";
              }
            });
          }
        }
      })
      .state('verify', { // Верификация
        url: '/verify-email/:token',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/verify.html',
            controller: 'VerifyCtrl',
            controllerAs: 'verifyCtrl'
          }
        }
      })
      .state('resetPassword', { // Сброс пароля
        url: '/reset-password/:token',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/reset-password.html',
            controller: 'ResetPasswordCtrl',
            controllerAs: 'resetCtrl'
          }
        },
        resolve: {
          "currentUser": function ($meteor, $stateParams) {
            Session.set('resetPasswordToken', $stateParams.token);

            return $stateParams.token;
          }
        }
      })
      .state('login', { // Страница логина
        url: '/login',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/login.html',
            controller: 'LoginCtrl',
            controllerAs: 'loginCtrl'
          }
        }
      })
      .state('unsubscribe', { // Страница отписки от рассылок
        url: '/unsubscribe?:sentletter',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/unsubscribe.html',
            controller: 'UnsubscribeCtrl',
            controllerAs: 'unsubscribeCtrl'
          }
        }
      })
      .state('trial', { // Страница получения бесплатного доступа
        url: '/trial?:token&:emtoken',
        views: {
          "mainView": {
            templateUrl: 'client/payment/views/trial.html',
            controller: 'TrialCtrl',
            controllerAs: 'trialCtrl',
            resolve: {
              "currentUser": function ($meteor, $cookies, $stateParams) {
                $cookies.put('trial', 'true');
                $cookies.put('token', $stateParams.token);
                $cookies.put('emtoken', $stateParams.emtoken);

                return $meteor.requireUser();
              }
            }
          }
        }
      })
      .state('payment', { // Страница оплаты участия
        url: '/payment?:url',
        views: {
          "mainView": {
            templateUrl: 'client/payment/views/payment.html',
            controller: 'PaymentCtrl',
            controllerAs: 'paymentCtrl',
            resolve: {
              "currentUser": function ($meteor, $cookies, $stateParams) {
                $cookies.put('payment', 'true');
                $cookies.put('url', $stateParams.url);
                return $meteor.requireUser();
              }
            }
          }
        }
      })
      .state('regpaymentsuccess', { // Страница ввода пароля после оплаты
        url: '/reg-payment/success',
        views: {
          "mainView": {
            templateUrl: 'client/payment/views/reg-payment-success.html',
            controller: 'RegPaymentSuccessCtrl',
            controllerAs: 'rpSuccess'
          }
        }
      })
      .state('regpaymentfailure', { // Страница ввода пароля после оплаты
        url: '/reg-payment/failure',
        views: {
          "mainView": {
            templateUrl: 'client/payment/views/reg-payment-failure.html',
            controller: 'RegPaymentFailureCtrl',
            controllerAs: 'rpFailure'
          }
        }
      })
      .state('assignstream', { // Страница присвоения потока зевакам
        url: '/assignstream?:stream&:token',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/assign-stream.html',
            controller: 'AssignStreamCtrl',
            controllerAs: 'assignStream',
            resolve: {
              "currentUser": function ($meteor, $cookies, $stateParams) {
                $cookies.put('stream', $stateParams.stream);
                $cookies.put('token', $stateParams.token);
                return $meteor.requireUser();
              }
            }
          }
        }
      })
      .state('rules', { // Страница правил
        url: '/rules',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/rules.html',
            controller: 'RulesCtrl',
            controllerAs: 'rc',
            resolve: {
              "currentUser": function ($meteor) {
                return $meteor.requireUser();
              }
            }
          }
        }
      })
      .state('mentor', { // Страница менторки
        url: '/mentor',
        views: {
          "mainView": {
            templateUrl: 'client/mentors/views/mentor.html',
            controller: 'MentorCtrl'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(Roles.userIsInRole(user._id, ['tasks-review']) || Roles.userIsInRole(user._id, ['tasks-assign'])){
                return true;
              } else {
                return "FORBIDDEN";
              }
            });
          }
        }
      })
        .state('mentorusers', { // Страница выбора пользователя для проверки отчетов
          url: '/mentor/users',
          views: {
            "mainView": {
              templateUrl: 'client/mentors/views/mentor-users.html',
              controller: 'MentorUsersCtrl',
              controllerAs: 'mentorUsers'
            },
            "searchView": {
              templateUrl: 'client/common/partials/search.html',
              controller: 'SearchViewCtrl',
              controllerAs: 'searchView'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['tasks-review'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('mentorreview', { // Страница выбора задания для проверки
          url: '/mentor/review/:userId',
          views: {
            "mainView": {
              templateUrl: 'client/mentors/views/mentor-review.html',
              controller: 'MentorReviewCtrl',
              controllerAs: 'mentorReview'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['tasks-review'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
      .state('admin', { // Страница админки
        url: '/admin',
        views: {
          "mainView": {
            templateUrl: 'client/admins/views/admin.html',
            controller: 'AdminCtrl',
            controllerAs: 'adminCtrl'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(Roles.userIsInRole(user._id, ['users-manage']) || Roles.userIsInRole(user._id, ['programs-manage']) || Roles.userIsInRole(user._id, ['mentor-assign'])){
                return true;
              } else {
                return "FORBIDDEN";
              }
            });
          }
        }
      })
        .state('adminusers', { // Страница админки пользователей
          url: '/admin/users',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-users.html',
              controller: 'AdminUsersCtrl',
              controllerAs: 'adminUsers'
            },
            "searchView": {
              templateUrl: 'client/common/partials/search.html',
              controller: 'SearchViewCtrl',
              controllerAs: 'searchView'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['users-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminrules', { // Страница админки правил
          url: '/admin/rules',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-rules.html',
              controller: 'AdminRulesCtrl',
              controllerAs: 'adminRules'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['users-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminprogramrules', { // Страница админки правил
          url: '/admin/programrules',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-program-rules.html',
              controller: 'AdminProgramRulesCtrl',
              controllerAs: 'adminPR'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['users-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminprograms', { // Страница админки программ
          url: '/admin/programs',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-programs.html',
              controller: 'AdminProgramsCtrl',
              controllerAs: 'adminPrograms'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['programs-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminadvert', { // Страница админки рекламного сообщения
          url: '/admin/advert',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-advert.html',
              controller: 'AdminAdvertCtrl',
              controllerAs: 'adminAdvert'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['programs-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('admintasks', { // Страница админки заданий программы и редактирования программы
          url: '/admin/tasks/:programId',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-tasks.html',
              controller: 'AdminTasksCtrl',
              controllerAs: 'adminTasks'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['programs-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminstreams', { // Страница редактирования звездочек и потока
          url: '/admin/streams/:streamId',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-streams.html',
              controller: 'AdminStreamsCtrl',
              controllerAs: 'adminStreams'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['programs-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
        .state('adminrolesmanage', { // Страница админки редактирования ролей
          url: '/admin/rolesmanage',
          views: {
            "mainView": {
              templateUrl: 'client/admins/views/admin-roles-manage.html',
              controller: 'AdminRolesManageCtrl',
              controllerAs: 'adminRM'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(Roles.userIsInRole(user._id, ['users-manage'])){
                  return true;
                } else {
                  return "FORBIDDEN";
                }
              });
            }
          }
        })
      .state('profile', { // Страница редактирования профиля
        url: '/profile',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/profile.html',
            controller: 'ProfileEditCtrl',
            controllerAs: 'profileEdit'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(user.profile){
                return true;
              } else {
                return "RULESNOTACCEPTED";
              }
            });
          }
        }
      })
      .state('profileview', { // Страница просмотра профиля
        url: '/profile/:userId',
        views: {
          "mainView": {
            templateUrl: 'client/users/views/profile-view.html',
            controller: 'ProfileViewCtrl',
            controllerAs: 'profileView'
          }
        },
        resolve: {
          "currentUser": function ($meteor, $stateParams) {
            return $meteor.requireValidUser(function(user) {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if(user.profile.rulesAccepted && user.emails[0]['verified']){
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                return "EMAILNOTVERIFIED";
              } else {
                return "RULESNOTACCEPTED";
              }
            });
          }
        }
      })
      .state('streams', { // Страница стены потока
        url: '/streams/:programId/:streamId',
        views: {
          "mainView": {
            templateUrl: 'client/programs/views/stream-wall.html',
            controller: 'StreamWallCtrl',
            controllerAs: 'streamWall'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if(user.profile.rulesAccepted && user.emails[0]['verified']){
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                return "EMAILNOTVERIFIED";
              } else {
                return "RULESNOTACCEPTED";
              }
            });
          }
        }
      })
      .state('taskwall', { // Страница стены задания
        url: '/taskwall/:streamId/:taskId',
        views: {
          "mainView": {
            templateUrl: 'client/programs/views/task-wall.html',
            controller: 'TaskWallCtrl',
            controllerAs: 'taskWall'
          }
        },
        resolve: {
          "currentUser": function ($meteor) {
            return $meteor.requireValidUser(function(user) {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if(user.profile.rulesAccepted && user.emails[0]['verified']){
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                return "EMAILNOTVERIFIED";
              } else {
                return "RULESNOTACCEPTED";
              }
            });
          }
        }
      })
      .state('tasks', {
        url: '/tasks',
        abstract: true,
        views: {
          "mainView": {
            templateUrl: 'client/tasks/views/tasks.html'
          }
        }
      })
        .state('tasks.list', { // Страница списка заданий
          url: '/list',
          views: {
            "tasksView": {
              templateUrl: 'client/tasks/views/tasks-list.html',
              controller: 'TasksListCtrl',
              controllerAs: 'tasksList'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(user.profile.nopassword) {
                  return "NOPASSWORD";
                }

                if(user.profile.rulesAccepted && user.emails[0]['verified']){
                  return true;
                } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                  return "EMAILNOTVERIFIED";
                } else {
                  return "RULESNOTACCEPTED";
                }
              });
            }
          }
        })
        .state('tasks.details', { // Страница информации о задании
          url: '/:userId/:taskId',
          views: {
            "tasksView": {
              templateUrl: 'client/tasks/views/task-details.html',
              controller: 'TaskDetailsCtrl',
              controllerAs: 'tasksDetails'
            }
          },
          resolve: {
            "currentUser": function ($meteor) {
              return $meteor.requireValidUser(function(user) {
                if(user.profile.nopassword) {
                  return "NOPASSWORD";
                }

                if(user.profile.rulesAccepted && user.emails[0]['verified']){
                  return true;
                } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
                  return "EMAILNOTVERIFIED";
                } else {
                  return "RULESNOTACCEPTED";
                }
              });
            }
          }
        })
      .state('shares', { // Страница информации о расшаренном отчете
        url: '/shares/:taskId',
        views: {
          "mainView": {
            templateUrl: 'client/shares/views/share-task.html',
            controller: 'ShareTaskCtrl',
            controllerAs: 'shareTask'
          }
        }
      })
      .state('chats', {
        url: '/chats',
        views: {
          mainView: {
            templateUrl: 'client/chats/views/chats-list.html',
            controller: 'ChatsListCtrl',
            controllerAs: 'chatsList',
          },
        },
        resolve: {
          currentUser($meteor) {
            return $meteor.requireValidUser((user) => {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if (user.profile.rulesAccepted && user.emails[0].verified) {
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0].verified) {
                return 'EMAILNOTVERIFIED';
              }
              return 'RULESNOTACCEPTED';
            });
          },
        },
      })
      .state('chatdetails', {
        url: '/chat/:chatId',
        views: {
          mainView: {
            templateUrl: 'client/chats/views/chat-details.html',
            controller: 'ChatDetailsCtrl',
            controllerAs: 'chatDetails',
          },
        },
        resolve: {
          currentUser($meteor) {
            return $meteor.requireValidUser((user) => {
              if(user.profile.nopassword) {
                return "NOPASSWORD";
              }

              if (user.profile.rulesAccepted && user.emails[0].verified) {
                return true;
              } else if (user.profile.rulesAccepted && !user.emails[0].verified) {
                return 'EMAILNOTVERIFIED';
              }
              return 'RULESNOTACCEPTED';
            });
          },
        },
      })
    .state('chatconfig', {
      url: '/chatconfig/:chatId',
      views: {
        mainView: {
          templateUrl: 'client/chats/views/chat-config.html',
          controller: 'ChatConfigCtrl',
          controllerAs: 'chatConfig',
        },
      },
      resolve: {
        currentUser($meteor) {
          return $meteor.requireValidUser((user) => {
            if(user.profile.nopassword) {
              return "NOPASSWORD";
            }

            if (user.profile.rulesAccepted && user.emails[0].verified) {
              return true;
            } else if (user.profile.rulesAccepted && !user.emails[0].verified) {
              return 'EMAILNOTVERIFIED';
            }
            return 'RULESNOTACCEPTED';
          });
        },
      },
    })
    .state('answers', {
      url: '/answers',
      views: {
        "mainView": {
          templateUrl: 'client/answers/views/answers-list.html',
          controller: 'AnswersListCtrl',
          controllerAs: 'answersList'
        }
      },
      resolve: {
        "currentUser": function ($meteor) {
          return $meteor.requireValidUser(function(user) {
            if(user.profile.nopassword) {
              return "NOPASSWORD";
            }

            if(user.profile.rulesAccepted && user.emails[0]['verified']){
              return true;
            } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
              return "EMAILNOTVERIFIED";
            } else {
              return "RULESNOTACCEPTED";
            }
          });
        }
      }
    })
    .state('feed', {
      url: '/feed',
      views: {
        "mainView": {
          templateUrl: 'client/feed/views/feed.html',
          controller: 'FeedCtrl',
          controllerAs: 'feedCtrl'
        }
      },
      resolve: {
        "currentUser": function ($meteor) {
          return $meteor.requireValidUser(function(user) {
            if(user.profile.nopassword) {
              return "NOPASSWORD";
            }

            if(user.profile.rulesAccepted && user.emails[0]['verified']){
              return true;
            } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
              return "EMAILNOTVERIFIED";
            } else {
              return "RULESNOTACCEPTED";
            }
          });
        }
      }
    })
    .state('contacts', {
      url: '/contacts',
      views: {
        "mainView": {
          templateUrl: 'client/contacts/views/contacts-list.html',
          controller: 'ContactsListCtrl',
          controllerAs: 'contactsList'
        },
        "searchView": {
          templateUrl: 'client/common/partials/search.html',
          controller: 'SearchViewCtrl',
          controllerAs: 'searchView'
        },
        "sortView": {
          templateUrl: 'client/common/partials/sort.html',
          controller: 'SortViewCtrl',
          controllerAs: 'sortView'
        }
      },
      resolve: {
        "currentUser": function ($meteor) {
          return $meteor.requireValidUser(function(user) {
            if(user.profile.nopassword) {
              return "NOPASSWORD";
            }

            if(user.profile.rulesAccepted && user.emails[0]['verified']){
              return true;
            } else if (user.profile.rulesAccepted && !user.emails[0]['verified']) {
              return "EMAILNOTVERIFIED";
            } else {
              return "RULESNOTACCEPTED";
            }
          });
        }
      }
    });

    if (Meteor.settings.public.SHOW_REG_PAYMENT) {
      $stateProvider.state('regpayment', { // Страница оплаты участия + регистрация
        url: '/reg-payment',
        views: {
          "mainView": {
            templateUrl: 'client/payment/views/reg-payment.html',
            controller: 'RegPaymentCtrl',
            controllerAs: 'regPayment'
          }
        }
      });
    }

    $urlRouterProvider.otherwise("/");
  });

angular.module('bubliq').run(function($rootScope, $state, $cookies) {
  $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
    const checkIfResetNeeded = (stateName) => {
      return (stateName === 'verify' || stateName === 'index' || stateName === 'resetPassword');
    }
    $state.overflowInitial = false;

    $state.title = '';
    $state.showTitle = true;

    let previousArray = checkIfResetNeeded(fromState.name) ? '[]' : $cookies.get('previousArray');
    let previousParamsArray = checkIfResetNeeded(fromState.name) ? '[]' : $cookies.get('previousParamsArray');

    try {
      $state.previousArray = previousArray ? JSON.parse(previousArray) : [];
      $state.previousParamsArray = previousParamsArray ? JSON.parse(previousParamsArray) : [];
    } catch (e) {
      $state.previousArray = [];
      $state.previousParamsArray = [];
    }

    if (fromState.name !== "" && !$state.back && _.last($state.previousArray) !== fromState.name) {
      $state.previousArray.push(fromState.name);
      $state.previousParamsArray.push(fromParams);
    } else {
      $state.back = false;

      $state.previousArray.splice($state.previousArray.length-1, 1);
      $state.previousParamsArray.splice($state.previousParamsArray.length-1, 1);
    }

    $cookies.put('previousArray', JSON.stringify($state.previousArray));
    $cookies.put('previousParamsArray', JSON.stringify($state.previousParamsArray));

    DocHead.removeDocHeadAddedTags();
    if(toState.name !== 'assignstream' && $rootScope.currentUser && $rootScope.currentUser.profile
        && $rootScope.currentUser.profile.instructionNotRead) {
      $state.go('assignstream');
    }
  });
  $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
    switch(error) {
      case "AUTH_REQUIRED":
        $state.go('login');
        break;
      case "NOPASSWORD":
        $state.go('regpaymentsuccess');
        break;
      case "RULESNOTACCEPTED":
        $state.go('rules');
        break;
      case "EMAILNOTVERIFIED":
        $state.go('profile');
        break;
      case "ACCESSENDED":
        $state.go('login');
        break;
      case "FORBIDDEN":
        $state.go('login');
        break;
      default:
        $state.go('login');
    }
  });
});
