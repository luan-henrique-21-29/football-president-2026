import {bind as boardBind} from './actions-board.js';
import {state,persist} from './state.js';
import {answerPress,maybeCreatePressEvent} from './media-engine.js';
export function bind(render){boardBind(render);maybeCreatePressEvent(state.save);document.querySelectorAll('[data-press-answer]').forEach(el=>el.onclick=()=>{answerPress(state.save,el.dataset.pressEvent,el.dataset.pressAnswer);persist();render()})}
