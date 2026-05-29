import chalk from 'chalk';

export function info(msg: string): void {
  console.log(chalk.blue('→'), msg);
}

export function success(msg: string): void {
  console.log(chalk.green('✓'), msg);
}

export function warning(msg: string): void {
  console.log(chalk.yellow('⚠'), msg);
}

export function error(msg: string): void {
  console.log(chalk.red('✗'), msg);
}
