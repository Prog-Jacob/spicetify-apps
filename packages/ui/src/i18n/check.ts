// Compile-time assertion: ensures ar.json covers all message keys
import ar from './ar.json';
import type { UiMessages } from './en';

export default ar satisfies UiMessages;
