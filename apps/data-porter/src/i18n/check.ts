// Compile-time assertion: ensures ar.json covers all message keys
import ar from './ar.json';
import type { DataPorterMessages } from './en';

export default ar satisfies DataPorterMessages;
