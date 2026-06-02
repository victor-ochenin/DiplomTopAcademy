//Декларируем модуль .md сообщая что любой импорт .md возвращает строку
//Без этого tsc --noEmit выдаёт ошибку TS2307: Cannot find module '../lessons/.../what-is-react.md'. esbuild бы собрал, но проверка типов ломается на уровне запуска npm run compile
declare module '*.md' {
  const content: string;
  export default content;
}
