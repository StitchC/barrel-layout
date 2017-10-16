/*
	木桶布局类
	参数:
	   wrapper: 
	   类型: HTMLElement
	   描述: 木桶布局的初始化包裹层由用户自己定义

	   items:
	   类型: HTMLElementList
	   描述: 需要木桶布局的子项

   	   baseHeight:
	   类型: Integer
	   描述: 用户规定木桶布局每一行的基础高度 实际输出时会与这个高度有差异

   	   流程：
   	   		计算 ==> 整理 ==> 渲染dom


   	   属性:
			barrelWrap:
			类型: HTMLElement
			描述: 保存用户传进来的外包裹层

			items:
			类型: HTMLElementList
			描述: 保存用户传进来的所有需要木桶布局的子元素集
			
			baseHeight:
			类型: Integer
			描述: 接收用户设置的基本高度
			
			lastRow:
			类型: Array
			描述: 保存上一次渲染木桶布局后最后一行的元素

			lastItemIndex:
			类型: Integer

		方法:
			calc:
			参数: 
				itemList: (Array) 接收需要木桶布局的dom 元素列
			返回值: Object
					{
						elemArr: 二维数组，保存每一行应有的元素
						rowHeightArr: 一维数组，保存每一行的实际宽度
					}
			类型: HTMLElementList
			描述: 将需要进行木桶布局的 dom 元素(通常是img) 传入这个函数中
				  首先会根据元素的宽高比例计算出每一个元素按比例缩放的宽度
				  根据宽度计算出一行能够放入多少个元素
				  当计算完一行应有元素时再计算出该行的高度, 公式为:
				  该行所有元素宽度总和 / 用户定义的基本高 = 该行在浏览器显示的宽度 / y
				  y 为最后的运算结果
				  最后，将每一个木桶布局元素的高度设置为 y 其宽度总和便会自动填充满整行

			render: 
			参数: rowsArr: (Array) 每一行需要渲染的dom 元素
				  rowHeightArr: (Array) 每一行的实际行高
			返回值: void
			描述: 对calc 方法返回的数据进行渲染dom
				  此方法会首先判断有没有 class="barrel-container" 这个元素存在
				  如果不存在证明是第一次初始化 
				  为用户指定的 wrapper 元素下生成一个ul类名为barrel-container
				  在container 下面输出dom

				  如果barrel-container 存在证明是重新渲染
				  那么将最后一个li 移除再紧接着输出

			init:
			参数: null
			返回值: void
			描述: 调用上面两个方法渲染dom

			refresh:
			参数: newItemsList: (HTMLElemsList)
			描述: 为了减少dom 的渲染
				  当从服务器将加载图片添加到包裹层中时可调用此方法
				  此方法会根据上一次渲染后的 lastItemIndex 对新元素数组进行切割
				  切割完成后和上一次渲染后的最后一行元素列合并组成新的渲染数组
				  之后依次调用 calc() render() 完成输出
				  *注意一点:
				   上一次渲染后最后一行的元素已经设置好了高度所以在计算前要将
				   最后一行的元素清空样式防止布局错乱
					

*/

function BarrelLayout(wrapper, items, baseHeight) {
	this.barrelWrap = wrapper;
	this.items = items;
	this.baseHeight = baseHeight;
	// 下面是函数附带的属性
	this.lastRow = [];			// 保存上一次加载元素中最后一行的元素
	this.lastItemIndex = 0;		// 保存最后一个元素的下标
	this.init();
}
BarrelLayout.prototype.init = function(){
	var layoutData = this.calc(this.items);
	// 保存最后一行的元素
	this.lastRow = layoutData.elemArr[layoutData.elemArr.length - 1];
	// 保存最后一个元素的index
	this.lastItemIndex = this.items.length;
	this.render(layoutData.elemArr, layoutData.rowHeightArr);
};

BarrelLayout.prototype.calc = function(itemsList){
	// 私有变量
	var resultElemArr = [],			// 最终返回的保存每一行的数组
		resultRowHeightArr = [],	// 最终返回的保存每一行的基本行高的数组
		tempElemArr = [],			// 保存每一行应有元素的数组
		widthRate = 0,				// 元素的宽度比例
		heightRate = 0,				// 元素的高度比例
		totalWidth = 0;				// 行元素的宽度总和
		

	var len  = itemsList.length;

	for (var i = 0; i < len; i++) {
		// 计算元素宽高比例
		// 再求出缩放下的宽度
		widthRate = itemsList[i].offsetWidth / itemsList[i].offsetHeight;
		var curElemWidth = this.baseHeight * widthRate;
		totalWidth += curElemWidth;

		// 如果当元素相加宽度小于容器宽度将它推进 tempElemArr 数组
		// totalWidth 加上这个元素的宽度
		if(totalWidth <= this.barrelWrap.offsetWidth) {
			tempElemArr.push(itemsList[i]);

			// 如果当前的元素是最后一个且总宽度没有超过容器宽度
			// 将此时的tempElemArr 放入 this.rows 数组中
			
			if(i === len - 1) {
				resultElemArr.push(tempElemArr);
				// 行高设置为默认的baseHeight
				resultRowHeightArr.push(this.baseHeight);
			}
			

		}else {
			// 如果当前元素宽度相加大于容器宽度 进行如下操作
			// 1.计算当前元素宽度总和与baseHeight 的比率 根据比率设置当前行的高度
			// 从而设置行内的每一个元素的高度 调整到最适合的宽度
			heightRate = this.baseHeight / (totalWidth - curElemWidth);
			// 精确高度到两位小数
			var curColHeight = Math.floor(((this.barrelWrap.offsetWidth * heightRate) * 100)) / 100;
			// 2.将这一行的行高推入 rowHeight 数组
			resultRowHeightArr.push(curColHeight);
			// 3.将这一行应有的元素推入
			resultElemArr.push(tempElemArr);
			// 4.tempElemArr 数组重新填入这个超出容器宽度的元素
			tempElemArr = [itemsList[i]];
			// 5.重设totalWidth 为这个元素的宽度
			totalWidth = curElemWidth
			
			if(i === len - 1) {
				resultElemArr.push(tempElemArr);
				// 行高设置为默认的baseHeight
				resultRowHeightArr.push(this.baseHeight);
			}
			
		}
	}

	return {
		elemArr: resultElemArr,
		rowHeightArr: resultRowHeightArr
	}
};


BarrelLayout.prototype.render = function(rowsArr, rowHeightArr){
	var container = document.querySelectorAll('.barrel-container')[0];
	if(container === undefined) {
		container = document.createElement('ul');
		container.className = 'barrel-container';
	}else {
		// 如果barrel-container 存在证明是刷新操作
		// 此时要将视图中容器里面最后一行的li 删掉
		// 然后再生成元素 加入到容器中
		var rows = container.querySelectorAll('.barrel-row');
		container.removeChild(rows[rows.length - 1]);
	}
	
 	for (var i = 0; i < rowsArr.length; i++) {
 		var li = document.createElement('li');
 		li.className = 'barrel-row';
 		for (var k = 0; k < rowsArr[i].length; k++) {
 			rowsArr[i][k].style.height = rowHeightArr[i] + 'px';
 			rowsArr[i][k].parentNode.style.display = 'inline-block';
 			
 			li.appendChild(rowsArr[i][k].parentNode);
 			container.appendChild(li);
 		}
 	}

 	this.barrelWrap.appendChild(container);
};

BarrelLayout.prototype.refresh = function(newItemsList){
	// 1. 首先调整最后一行的元素排列
	// 对新的元素列表进行切割 分离出新加入的元素 根据this.lastItemIndex进行切割
	var newList = Array.prototype.slice.call(newItemsList, this.lastItemIndex),
		lastRow = this.lastRow; 

	for (var i = 0; i < lastRow.length; i++) {
		lastRow[i].style = '';
	}
	// 将新加入的元素与上一次渲染后最后一个行的元素列连接起来
	var totalList = lastRow.concat(newList);
	var layoutData = this.calc(totalList);
	this.render(layoutData.elemArr, layoutData.rowHeightArr);
	// 对 this.lastItemIndex 重新赋值为下一次刷新做准备
	this.lastItemIndex += totalList.length - lastRow.length;
	this.lastRow = layoutData.elemArr[layoutData.elemArr.length - 1];


};