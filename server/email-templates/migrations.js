// 01.00.03 setup Email templates
const migrateAt10003 = () => {
  const notifyLetter301 = Letters.findOne({"name": "Уведомление 3.01"});
  if(!notifyLetter301){
    const letter = {
      name: "Уведомление 3.01",
      subject: "Новое задание!",
      preheader: "",
      text: ''
    };

    Letters.insert(letter);
  }

  const guestLetter000 = Letters.findOne({"name": "Гостю 0.00"});
  if(!guestLetter000){
    const letter = {
      name: "Гостю 0.00",
      subject: "Подтверждение email адреса для Space Bagel",
      preheader: "",
      text: '<div><div>Вот url для подтверждения email.</div><div>Входите. И не забудьте заполнить профиль!</div><div style="margin-top: 20px;"><strong>ВАЖНО!</strong> Если вам НЕ ПРИДЕТ письмо от нас через несколько секунд, пожалуйста, проверьте не "залетело" ли оно в папку <strong>СПАМ</strong> (такая папка есть в каждом email-сервисе недалеко от папки <strong>"Входящие"</strong>).</div><div>Особенно часто это случается с теми, кто использует почту на gmail (это иногда происходит по ошибке email-служб)</div><div>Если вы НАЙДЕТЕ его в папке "СПАМ", <strong>обязательно отметьте его как "не спам"</strong>, чтобы получать задания наших программ без проблем.</div></div>'
    };

    Letters.insert(letter);
  }

  const guestLetter001 = Letters.findOne({"name": "Гостю 0.01"});
  if(!guestLetter001){
    const letter = {
      name: "Гостю 0.01",
      subject: "Добро пожаловать на борт",
      preheader: "",
      text: '<div style="padding-top: 20px;">Добро пожаловать на борт. Наша следующая программа стартует 18 июля. Вас ждет 6 недель интересных и развивающих заданий и крутое комьюнити. Программа стоит 5 тысяч рублей. Вы можете оплатить ее сейчас, или попробовать ее, участвуя в бесплатной пробной неделе.</div><div style="padding-top: 20px;"><div>Команда Космического бублика</div></div><div style="padding-top: 20px;"><a href="https://entry.spacebagel.com/payment?url=payment" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.6rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">ОПЛАТИТЬ</a></div><div style="padding-top: 20px;"><a href="https://entry.spacebagel.com/payment?url=trial" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.6rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">ПОПРОБОВАТЬ НЕДЕЛЮ БЕСПЛАТНО</a></div>'
    };

    Letters.insert(letter);
  }

  const guestLetter002 = Letters.findOne({"name": "Гостю 0.02"});
  if(!guestLetter002){
    const letter = {
      name: "Гостю 0.02",
      subject: "Попробуйте наш бублик",
      preheader: "",
      text: '<div>Друзья, предлагаем Вам поучаствовать в пробной неделе. Зарегистрируйтесь, и мы уведомим вас о ее начале.</div><div style="padding-top: 20px;padding-bottom: 20px;">Команда Космического бублика</div><div><a href="url" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.2rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">ХОЧУ ПОПРОБОВАТЬ</a></div>'
    };

    Letters.insert(letter);
  }

  const freeLetter101 = Letters.findOne({"name": "Зевакам 1.01"});
  if(!freeLetter101){
    const letter = {
      name: "Зевакам 1.01",
      subject: "Две новости, вторая хорошая",
      preheader: "",
      text: ''
    };

    Letters.insert(letter);
  }

  const freeLetter102 = Letters.findOne({"name": "Зевакам 1.02"});
  if(!freeLetter102){
    const letter = {
      name: "Зевакам 1.02",
      subject: "Регистрация в бесплатную лайт-программу для зевак",
      preheader: "Побыть зевакой, все разглядеть и поработать над какой-либо сферой жизни",
      text: '<div>Вот и&nbsp;ссылка на&nbsp;бесплатную лайт-программу. Вы&nbsp;можете побыть зевакой, все разглядеть и&nbsp;поработать над какой-либо сферой жизни.</div><div>Для этого вам необходимо выбрать тематическую программу, наиболее для вас интересную. Только одну, да. Нет, две нельзя. Программы три:</div><br/><div>1. <strong>Цели, задачи, деньги, любимая работа, бизнес</strong>&nbsp;&mdash; самый прагматичный, хотя медитации тоже будут. Какие&nbsp;же деньги без медитаций?</div><div>2. <strong>Отношения, любовь, дружба, партнерство</strong>&nbsp;&mdash; все о&nbsp;нашем взаимодействии с&nbsp;людьми на&nbsp;этой планете, о&nbsp;том как делать его эффективным.</div><div>3. <strong>Самопознание, предназначение, развитие сознания</strong>&nbsp;&mdash; самый эзотеричный и&nbsp;направленный вглубь личности, но&nbsp;и&nbsp;практичный тоже.</div><div style="padding-top: 20px;">Выбирайте скорее, читайте на&nbsp;портале инструкцию &laquo;Как все происходит&raquo; и&nbsp;участвуйте на&nbsp;здоровье!</div><div style="padding-top: 20px;"><a href="urlGoals" style="background-color: #ffcc01;color: #8c641e;padding: 25px 26px;font-size: 1.2rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">Цели, задачи, деньги, бизнес</a></div><div style="padding-top: 20px;"><a href="urlRelationship" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.2rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">Отношения: любовь, дружба, партнерство</a></div><div style="padding-top: 20px;"><a href="selfDiscovery" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.2rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">Самопознание, предназначение, развитие сознания</a></div><div style="padding-top: 20px;padding-bottom: 20px;">Команда Космического бублика</div>'
    };

    Letters.insert(letter);
  }

  const freeLetter103 = Letters.findOne({"name": "Зевакам 1.03"});
  if(!freeLetter103){
    const letter = {
      name: "Зевакам 1.03",
      subject: "А вот и кнопка",
      preheader: "",
      text: '<div><div>Ну что же, теперь мы можем принимать деньги миллионом разных способов.</div><div style="padding-top: 20px;">Новеньким, тем кто зарегистрировался на портале недавно - вот кнопка оплаты, жмите смело, и вы получите статус Rookie, после чего мы распределим вас в один из потоков программы и 18-го апреля, утром вы получите первые инструкции и задание.</div><div style="padding-top: 20px;">Напоминаем, что программа идет 6 недель, стоимость 2 тысячи рублей.</div><div style="padding-top: 20px;">Те, кто регистрировался два месяца назад и был зевакой, приглашаем вас в Космический бублик-4. Если вы решили идти сейчас - жмите смело, и вас мы тоже распределим в поток программы. :)</div><div style="padding-top: 20px;">Если у вас есть вопросы, пишите, ответим.</div></div><div style="padding-top: 20px;padding-bottom: 20px;"><div>До встречи на борту!</div><div>Команда Космического Бублика</div></div><div><a href="url" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.2rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">ОПЛАТИТЬ</a></div>'
    };

    Letters.insert(letter);
  }
};

// 01.06.21 setup new Email templates
const migrateAt10621 = () => {
  const newLetter400 = Letters.findOne({"name": "Гостю 4.00"});
  if(!newLetter400){
    const letter = {
      name: "Гостю 4.00",
      subject: "Книга в подарок от Космического бублика",
      preheader: "Привет! Рады видеть тебя в нашей рассылке. Обещаем не спамить, писать только интересное и полезное.",
      text: '<div style="padding-top: 20px;">Привет! Рады видеть тебя в нашей рассылке. Обещаем не спамить, писать только интересное и полезное.<br />А пока забери скорее свой подарок с лайфхаками счастливых людей в закрытой <a href="https://yadi.sk/i/ZEpqW1gwusp7u">ссылке</a>.<br />Летим со мной, птичка, там много интересного. <br /></div><div style="padding-top: 20px;">Наташа Маркович и команда Космического бублика.</div><div style="padding-top: 20px;">ПС. Кстати, если ты подумывал о том, чтобы попасть в игру, то имей в виду, наш сайт все еще немножко помнит тебя и при оплате в течение 24 часов, всей игры или пробной недели, тебя ждет дополнительный крутой подарок за скорость и решительность - книга Наташи Маркович “Flutter. Круто блин. Хроники одного тренинга”. Это отличная книга издательства Рипол Классик,  которая уже несколько лет в списке лонгселлеров - книг, которые продаются стабильно и долго. Заявленный тираж - 200000 экз. Книга боевая, про важные жизненные цели и человеческую любовь.<br />Для тех у кого она уже есть - это новая редакция, немного исправленная.</div>'
    };

    Letters.insert(letter);
  }

  const newLetter401 = Letters.findOne({"name": "Rookie 4.01"});
  if(!newLetter401){
    const letter = {
      name: "Rookie 4.01",
      subject: "Добро пожаловать на борт Космического бублика",
      preheader: "Привет! Поздравляем и очень радуемся, что ты с нами в Космическом бублике.",
      text: '<div style="padding-top: 20px;">Привет!<br /> Поздравляем и очень радуемся, что ты с нами в Космическом бублике.<br />Вместе будем развивать иммунитет и бороться с вирусами, делая свою жизнь все лучше и лучше.<br />Тебя ждет 6 увлекательных недель, посвященных разным сферам твоей жини - ценности и предназначение, цели и задачи, деньги, отношения, тело и сексуальность и конечно же блок про умение мыслить как мастер.<br />И конечно кроме этого в бублике еще много-много интересного!<br /></div><div style="padding-top: 20px;">Стартуем <strong>26 ноября</strong>, а до этого времени заполни пожалуйста профиль.<br />И не забудь забрать свой подарок по закрытой ссылке, там много интересного!<br /><a href="https://yadi.sk/i/FfxfYU-8upzVv">Про деньги!</a><br />Если вдруг возникли сложности со скачиванием - пиши нам, все решим.<br />Увидимся на борту!<br /></div><div style="padding-top: 20px;">Наташа Маркович и команда Космического бублика.</div>'
    };

    Letters.insert(letter);
  }

  const newLetter402 = Letters.findOne({"name": "Rookie 4.02"});
  if(!newLetter402){
    const letter = {
      name: "Rookie 4.02",
      subject: "Добро пожаловать на борт Космического бублика",
      preheader: "Привет! Поздравляем и очень радуемся, что ты с нами в Космическом бублике.",
      text: '<div style="padding-top: 20px;">Привет еще раз!<br />Поздравляем и очень рады тому, что ты с нами в Космическом бублике!<br />Тебя ждет увлекательная игра, призы, общение с продвинутой публикой и множество открытий! Увидимся 26 ноября!<br />А до этого времени мы будем тебе иногда писать полезное и интересное.<br />А вот и подарок.<br />Выбери формат для скачивания книги:<br /><a href="https://yadi.sk/i/9QWKnDdducdn9">ePub</a>, <a href="https://yadi.sk/i/TrdomdPfucdoa">fb2</a>, <a href="https://yadi.sk/d/raOgH0JQucdqZ">Mobi</a>, <a href="https://yadi.sk/i/ulE7oK2Gucds9">PDF</a>, <a href="https://yadi.sk/d/xrzbkOjsucdyU">Sony lRF</a>, <a href="https://yadi.sk/d/-NwnY7D-ucdsm">TSR</a>, <a href="https://yadi.sk/d/w_2qppfXucdph">Microsoft LIT</a>, <a href="https://yadi.sk/d/OgI2owwQucdrF">Palm PDB</a><br /></div><div style="padding-top: 20px;">Если вдруг возникли сложности со скачаванием - пиши нам, все решим.<br />Наташа Маркович и команда Космического бублика.<br /></div>'
    };

    Letters.insert(letter);
  }
};

// 01.06.22 setup new Email templates 2
const migrateAt10622 = () => {
  const newLetter400 = Letters.findOne({"name": "Rookie/Trial 1.10"});
  if(!newLetter400){
    const letter = {
      name: "Rookie/Trial 1.10",
      subject: "Ты зарегистрирован!",
      preheader: "Успешная регистрация в Космическом бублике",
      text: '<div style="padding-top: 20px;">Привет, поздравляем ты зарегистрирован в игру "Космический бублик"!</div><div style="padding-top: 20px;">Тебя ждёт 6 удивительных недель самоисследования, общения с интересными людьми, инсайтов, открытий, перемен и удовольствий. Деньги, отношения, цели, любовь к себе, умение мыслить мастерски - все это и многое другое будет исследоваться в игре. Также тебя ждут клевые награды и призы.</div><div style="padding-top: 20px;">В общем, поехали!<br/>26 ноября мы выложим первые организационные посты.<br/>Не забудь до этого времени заполнить профиль.</div><div style="padding-top: 20px;">Команда Космического бублика</div><div style="padding-top: 20px;"><a href="https://entry.spacebagel.com/profile" style="background-color: #ffcc01;color: #8c641e;padding: 12px 26px;font-size: 1.6rem;line-height: 1.4em;font-weight: 400;display: block;border: 0;text-decoration: none;cursor: pointer;border-radius: 0;text-align: center;margin: auto;width: 300px;">ЗАПОЛНИТЬ ПРОФИЛЬ</a></div>'
    };

    Letters.insert(letter);
  }
};

// 01.00.03 setup Email templates
Migrations.add({
  version: 10003,
  name: 'setup Email templates',
  up: migrateAt10003,
});

// 01.06.21 setup new Email templates
Migrations.add({
  version: 10621,
  name: 'setup new Email templates',
  up: migrateAt10621,
});

// 01.06.22 setup new Email templates 2
Migrations.add({
  version: 10622,
  name: 'setup new Email templates 2',
  up: migrateAt10622,
});
