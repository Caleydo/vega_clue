//allow sass modules
declare module "*.scss" {
  const content:string;
  export default content;
}
declare module "*.css" {
  const content:string;
  export default content;
}
// allow image dependencies
declare module "*.png";
declare module "*.jpg";
declare module "*.gif";
declare module "*.webp";
declare module "*.svg";
//allow html dependencies
declare module "*.html" {
  const content:string;
  export default content;
}
declare module "*.xml" {
  const content:string;
  export default content;
}

//allow json dependencies
declare module "*.json";
//allow file dependencies
declare module "file-loader!*";
declare module "!file-loader!*"; // Prefixing with ! will disable all configured normal loaders
//allow file dependencies
declare module "raw-loader!*";
//allow url dependencies
declare module "url-loader!*";
//allow html dependencies
declare module "imports-loader!*";
