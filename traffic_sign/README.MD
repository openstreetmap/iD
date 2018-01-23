导入traffic_sign步骤
1.编辑svg到iD-sprite.src.svg文件。

2.readSvg 读取添加的svg文件，获取图标id，生成cateStr（添加到相应category文件末尾）文件和svgIds，及out/traffic_sign文件夹下的所有文件（添加到对应的presets目录）。

3.浏览器打开iD-sprite.src.svg文件，浏览器控制台执行calViewBox代码，获得ViewBox计算结果，加入iD-sprite.json文件

4.执行npm run all 编译到dist