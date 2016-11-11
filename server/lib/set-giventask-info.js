setGiventaskInfo = (giventask) => {
   giventask.task = Tasks._cache[giventask.taskId];
   giventask.stream = Streams._cache[giventask.streamId];

   giventask.gradeFill = 100;

   if (giventask.grade && giventask.task.maxgrade) {
     giventask.gradeFill = giventask.grade/giventask.task.maxgrade*100;

     if (giventask.gradeFill > 100) giventask.gradeFill = 100;
   }

   giventask.gradeFill = `width: ${Math.floor(giventask.gradeFill)}%`;

   let timeDifference = 0;
   if (giventask.task && giventask.stream && giventask.report && giventask.report.reportSendAt) {
     timeDifference = moment(giventask.report.reportSendAt)
       .diff(moment(giventask.stream.start)
         .add(giventask.task.end - 1, 'days')
         .add(43200, 'seconds')
         , 'seconds');
   }

   const timeEndDifference = (giventask.task && giventask.stream)
     ? moment()
       .diff(moment(giventask.stream.start)
         .add(giventask.task.end - 1, 'days')
         .add(43200, 'seconds'),
         'seconds')
     : -1;

   if (giventask.report && timeDifference > 0) {
     giventask.titleColor = 'red';
     giventask.statusIcon = {
       color: 'red',
       status: 'Отчет отправлен после срока сдачи',
       icon: 'maps:ic_local_post_office_24px',
     };
   } else if (giventask.report && timeDifference <= 0) {
     giventask.titleColor = 'rgb(63,81,181)';
     giventask.statusIcon = {
       color: 'rgb(63,81,181)',
       status: 'Отчет отправлен вовремя',
       icon: 'maps:ic_local_post_office_24px',
     };
   }

  return giventask
};
