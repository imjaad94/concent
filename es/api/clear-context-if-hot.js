import { clearObject, okeys } from '../support/util';
import ccContext from '../cc-context';
import { clearCachedData } from '../core/base/pick-dep-fns';
import { MODULE_DEFAULT, CC_DISPATCHER, MODULE_CC, MODULE_GLOBAL, MODULE_CC_ROUTER } from '../support/constant';
import initModuleComputed from '../core/computed/init-module-computed';

let justCalledByStartUp = false;

function _clearInsAssociation(recomputed) {
  clearObject(ccContext.event_handlers_);
  clearObject(ccContext.ccUKey_handlerKeys_);
  clearObject(ccContext.renderKey_ccUkeys_);
  const cct = ccContext.ccClassKey_ccClassContext_;
  Object.keys(cct).forEach(ccClassKey => {
    const ctx = cct[ccClassKey];
    clearObject(ctx.ccKeys);
  });
  clearObject(ccContext.handlerKey_handler_);
  clearObject(ccContext.ccUkey_ref_, [CC_DISPATCHER]);
  clearObject(ccContext.refs, [CC_DISPATCHER]);

  if (recomputed) {
    const rootState = ccContext.store._state;
    const computedValue = ccContext.computed._computedValue;
    const modules = okeys(rootState);
    modules.forEach(m => {
      if (computedValue[m]) initModuleComputed(m, computedValue[m]);
    });
  }
}

function _clearAll(recomputed = false) {
  clearObject(ccContext.globalStateKeys);
  clearObject(ccContext.reducer._reducer);
  clearObject(ccContext.store._state, [MODULE_DEFAULT, MODULE_CC, MODULE_GLOBAL, MODULE_CC_ROUTER], {});
  clearObject(ccContext.computed._computedDep);
  clearObject(ccContext.computed._computedValue);
  clearObject(ccContext.watch._watchDep);
  clearObject(ccContext.middlewares);
  clearCachedData();
  _clearInsAssociation(recomputed);
}

function _prepareClear(cb) {
  if (ccContext.isCcAlreadyStartup) {
    if (ccContext.isHotReloadMode()) {
      cb();
    } else {
      console.warn(`clear failed because of not running under hot reload mode!`);
    }
  }else{
    //还没有启动过，泽只是标记justCalledByStartUp为true
    justCalledByStartUp = true;
  }
}

export default function (clearAll = false, warningErrForClearAll) {
  _prepareClear(() => {
    if (clearAll) {
      justCalledByStartUp = true;
      _clearAll();
      console.warn(warningErrForClearAll);
    } else {
      // 如果刚刚被startup调用，则随后的调用只是把justCalledByStartUp标记为false
      // 因为在stackblitz的 hot reload 模式下，当用户将启动cc的命名单独放置在一个脚本里，
      // 如果用户修改了启动相关文件, 则会触发 runConcent renderApp，
      // runConcent调用清理把justCalledByStartUp置为true，则renderApp就可以不用执行了
      // 随后只是改了某个component文件时，则只会触发 renderApp，
      // 因为之前已把justCalledByStartUp置为false，则有机会清理实例相关上下文了
      if (justCalledByStartUp) {
        justCalledByStartUp = false;
        return;
      }

      console.warn(`attention: method[clearContextIfHot] need been invoked before your app rendered!`);

      // !!!重计算各个模块的computed结果
      _clearInsAssociation(true);
    }
  });
}
