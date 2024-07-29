export const SECOND_PX = 80; // 1s等于多少px
export const MILLISECOND_PX = SECOND_PX / 1000; // 1ms等于多少px
export const LINE_VIEW_HEIGHT = 60; // line view 高度 px
export const LINE_VIEW_WIDTH = 375; // line view 宽度 px
export const CURSOR_AREA_WIDTH = 100; // 游标左侧区域宽度 px
export const INTERVAL_TIME = 20; // 绘制间隔时间
export const FULL_MARK = 100; // 满分


const _pitchToY = (pitch = 0) => {
  return (pitch / 100) * LINE_VIEW_HEIGHT
}


function _filterReact(reacts, startX, endX) {
  return reacts.filter((item) => {
    const start = item.x;
    const end = start + item.width;
    if (start >= startX && end <= endX) {
      // 在屏幕中
      return true;
    } else if (start <= startX && end >= startX) {
      // 左侧部分超出屏幕
      return true;
    } else if (start <= endX && end >= endX) {
      // 右侧部分超出屏幕
      return true;
    }
    return false;
  });
}


function _cutOffReact(reacts, startX, endX) {
  return reacts.map((item) => {
    let start = item.x;
    let end = item.x + item.width;
    let newStart = start;
    let newEnd = end;
    if (start < startX) {
      // 超出左侧
      newStart = startX;
    } else if (end > endX) {
      // 超出右侧
      newEnd = endX;
    }
    return {
      ...item,
      x: newStart - startX, // 重新计算x坐标
      width: newEnd - newStart,
    };
  });
}


export const genUIReactList = (pitchList) => {
  let list = []
  for (let item of pitchList) {
    list.push({
      x: item.startTime * MILLISECOND_PX + CURSOR_AREA_WIDTH,
      y: _pitchToY(item.pitch),
      width: item.duration * MILLISECOND_PX,
    })
  }

  // console.log("genUIReactList", list)

  return list
};



export const filterUIReactList = (reactList, currentTime) => {
  const startX = currentTime * MILLISECOND_PX;
  // const cursorX = startX + CURSOR_AREA_WIDTH;
  const endX = startX + LINE_VIEW_WIDTH;

  // 过滤小块 (当前屏幕) (需要考虑到截断)
  let filterReactInfo = _filterReact(reactList, startX, endX);
  // 截断处理
  filterReactInfo = _cutOffReact(filterReactInfo, startX, endX);

  // console.log("filterUIReactList", filterReactInfo)

  return filterReactInfo
}
