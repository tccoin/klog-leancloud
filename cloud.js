const AV = require('leanengine')
const fs = require('fs')
const path = require('path')

/**
 * 加载 functions 目录下所有的云函数
 */
fs.readdirSync(path.join(__dirname, 'functions')).forEach(file => {
  require(path.join(__dirname, 'functions', file))
})

function createTimeline(article) {
  let TimelineItem = AV.Object.extend('Timeline');
  let timelineItem = new TimelineItem();
  let author = AV.Object.createWithoutData('UserPublic', article.get('author').id);
  timelineItem.set('referTo', article.id);
  timelineItem.set('type', 'article');
  timelineItem.set('author', author);
  timelineItem.set('text', article.get('text'));
  timelineItem.set('title', article.get('title'));
  timelineItem.set('path', article.get('path'));
  timelineItem.set('topic', article.get('topic'));
  timelineItem.set('collection', article.get('collection'));
  timelineItem.set('tags', article.get('tags'));
  timelineItem.set('image', article.get('image'));
  timelineItem.set('attachments', article.get('attachments'));
  timelineItem.set('comments', article.get('comments'));
  timelineItem.set('keywords', article.get('keywords'));
  timelineItem.set('updatedTime', new Date().getTime());
  timelineItem.save(() => {
    console.log('success,', article);
  }, err => {
    console.log('error,', err);
  });
}

function updateTimeline(timelineItem, article) {
  timelineItem.set('text', article.get('text'));
  timelineItem.set('title', article.get('title'));
  timelineItem.set('path', article.get('path'));
  timelineItem.set('topic', article.get('topic'));
  timelineItem.set('collection', article.get('collection'));
  timelineItem.set('tags', article.get('tags'));
  timelineItem.set('image', article.get('image'));
  timelineItem.set('attachments', article.get('attachments'));
  timelineItem.set('keywords', article.get('keywords'));
  timelineItem.set('comments', article.get('comments'));
  let now = new Date().getTime();
  let lastTime = timelineItem.get('date') || Date.parse(timelineItem.get('updatedAt'));
  let timefly = now - lastTime;
  console.log('timefly: ', timefly);
  console.log('label: ', article.get('label'));
  if (timefly > 6 * 3600 * 1000 && article.get('label').indexOf('keep-timeline-time')==-1) {
    timelineItem.set('date', now);
  }
  timelineItem.save();
}

/*获取过滤器
AV.Cloud.define('getFilters', function(request) {
  let query = new AV.Query('Article');
  let author = AV.Object.createWithoutData('UserPublic', request.currentUser.publicinfo.id);
  query.equalTo('author', author);
  return "link started!"
});*/

/*时间轴：添加文章*/
AV.Cloud.afterSave('Article', (request) => {
  let article = request.object;
  timelineItem.set('createdTime', new Date().getTime());
  timelineItem.set('updatedTime', new Date().getTime());
  if (!(article.get('private'))) createTimeline(article)
})

/*时间轴：更新文章*/
AV.Cloud.afterUpdate('Article', (request) => {
  let article = request.object;
  // timestamp
  if(article.get('label').indexOf('keep-article-time') == -1){
    article.set('updatedTime', Date.parse(new Date().getTime()));
  }
  // timeline
  let query = new AV.Query('Timeline');
  query.equalTo('referTo', article.id);
  return query.find().then((timelineItems) => {
    if (article.get('private')) {
      //删除timeline item
      if (timelineItems.length > 0) return AV.Object.destroyAll(timelineItems);
      return
    }
    if (timelineItems.length > 0) {
      //更新timeline item
      updateTimeline(timelineItems[0], article);
    } else {
      //新建timeline item
      createTimeline(article);
    }
  });
});

/*时间轴：删除文章*/
AV.Cloud.afterDelete('Article', (request) => {
  let article = request.object;
  let query = new AV.Query('Timeline');
  query.equalTo('referTo', article.id);
  return query.find().then((timelineItems) => {
    console.log('deleting:', timelineItems);
    return AV.Object.destroyAll(timelineItems);
  });
});

/*用户：新增*/
AV.Cloud.afterSave('_User', (request) => {
  let user = request.object;
  let query = new AV.Query('_User');
  query.count().then(function (count) {
    user.set('rank', count);
    user.save();
  });
});

/*预热*/
AV.Cloud.define('warmup', function (request) {
  return "link started!"
});

/*升级数据
AV.Cloud.define('updateAll', function(request) {
  let query = new AV.Query('Timeline');
  query.find().then((articles) => {
    for (let article of articles) {
      _article = article.toJSON();
      article.set('attachments', attachments);
      article.save();
    }
  });
});*/
