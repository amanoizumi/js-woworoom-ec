// 後台
// DOM
const orderBody = document.querySelector('#orderBody');
const discardAllBtn = document.querySelector('.discardAllBtn');
const orderAlert = document.querySelector('.order-alert');
const orderPageTable = document.querySelector('.orderPage-table');

// 訂單暫存
let ordersData = [];

function showError(err) {
  if(err.response.status === 400 || err.response.status === 403 || err.response.status === 404){
    Swal.fire({
        title:  `${err.response.data.message}`,
        icon: 'error',
        confirmButtonText: '確定',
      })
    }
}

// C3 圖表
// 整理成 C3 格式
function renderC3() {
  // 如果沒訂單就插入灰色圖表
  if(ordersData.length === 0) {
    let chart = c3.generate({
      bindto: '#chart', // HTML 元素綁定
      data: {
          type: "pie",
          columns: [
          ['目前沒有資料', 1],
          ],
          colors:{
            目前沒有資料:"#eeeeee",
          }
      },
    });
  } else {
    let arr = [];
    ordersData.forEach(item=>{
      item.products.forEach(product => {
        let obj = {
          productName: '',
          productIncome: 0,
        };
        obj.productName = product.title;
        obj.productIncome = product.quantity * product.price;
        arr.push(obj);
      })
    })
  
    let obj = {};
    arr.forEach(item=>{
      let name = item.productName;
      if(obj[name] === undefined) {
        obj[name] = item.productIncome;
      } else {
        obj[name] += item.productIncome;
      }
    })

    let columns = [];
  
    let keys = Object.keys(obj);
    let values = Object.values(obj);
    
    for(let i = 0; i < keys.length; i++) {
      let arr = [];
      arr.push(keys[i]);
      arr.push(values[i]);
      columns.push(arr);
    }

    // 依照賣出數量由大到小排序
    columns.sort((a,b) => {
      return b[1] - a[1];
    });
    
    // 切出前三名銷售量最高的品項
    let others = [];
    others = columns.splice(3);
    
    // 算出其他產品的總價格
    let othersPrice = 0;
    others.forEach(item => {
      othersPrice += item[1]
    })

    if(others.length > 0) {
      columns.push(['其他', othersPrice]);
    }

    let colorsArr = ['#301E5F','#5434A7', '#9D7FEA', '#DACBFF'];
    let colorsObj = {};
    // 製作出圖表，賣最多的品項顏色最深，「其他」是雜項的集合所以顏色最淺
    columns.forEach((item, index) => {
      if(colorsObj[item[0]] === undefined) {
        colorsObj[item[0]] = colorsArr[index];
      }
    })

    let chart = c3.generate({
      bindto: '#chart',
      data: {
          type: "pie",
          columns: columns,
          colors: colorsObj
      },
    });
  }
}


// GET 取得訂單列表
function getOrderList() {
  const url = `${apiPath}/admin/${myPath}/orders`;
  axios.get(url, config).then((res) => {
    ordersData = res.data.orders;
    renderOrder();
  }).catch((err) => {
    showError(err);
  })
}

// 秒轉換成日期字串
function calcOrderDay (num) {
  // 因為 UNIX 的時間戳記是毫秒，所以先把秒轉成毫秒
  num = num * 1000;
  let date = new Date(num);
  
  let yearStr = date.getFullYear();
  let monthStr = date.getMonth() + 1;
  let dateStr = date.getDate();

  if(monthStr < 10) {
    monthStr = '0' + monthStr;
  }
  if(dateStr < 10) {
    dateStr = '0' + dateStr;
  }

  let str = `${yearStr}/${monthStr}/${dateStr}`;
  return str;
}

// 渲染訂單列表 + 排序
function renderOrder() {
  if(ordersData.length === 0) {
    orderAlert.innerHTML = '目前沒有任何訂單！';
    orderPageTable.classList.add("d-none");
  } else if (ordersData.length !== 0){
    orderAlert.innerHTML = '';
    orderPageTable.classList.remove("d-none");

    // 訂購日期越早的訂單(優先處理)排越上面
    ordersData.sort((a,b) => {
      return a.createdAt - b.createdAt;
    })

    let str = ``;
    ordersData.forEach((item) => {
      let timeStr = calcOrderDay(item.createdAt);
      let productsStr = ``;
      item.products.forEach((products) => {
        productsStr += `<li>${products.title}：${products.quantity}</li>`;
      })
  
      str += `  <tr>
      <td>${item.createdAt}</td>
      <td>
          <p>${item.user.name}</p>
          <p>${item.user.tel}</p>
      </td>
      <td>${item.user.address}</td>
      <td>${item.user.email}</td>
      <td>
        <ul>
          ${productsStr}
        </ul>
      </td>
      <td>${timeStr}</td>
      <td class="orderStatus">
          <a href="#" class="orderStatus-Btn" data-id="${item.id}" data-state="${item.paid}">${item.paid ? `已處理` : `未處理`}</a>
      </td>
      <td>
          <input type="button" class="delSingleOrder-Btn" data-id="${item.id}"value="刪除">
      </td>
  </tr>`;
    })
    orderBody.innerHTML = str;
  }

  renderC3();
}


// 監聽事件：監聽產品列表點擊到的元素來選擇觸發的事件
function doSomething(e) {
  e.preventDefault();

  const targetClass = e.target.getAttribute('class');
  const orderId = e.target.getAttribute('data-id');
  const orderState = e.target.getAttribute('data-state');

  if(targetClass !== 'orderStatus-Btn' && targetClass !== 'delSingleOrder-Btn') {
    return;
  }

  if(targetClass === 'orderStatus-Btn') {
    editOrder(orderState, orderId);
  } else if (targetClass === 'delSingleOrder-Btn') {
    deleteOrderItem(orderId);
  }

}

// PUT 更改訂單狀態
function editOrder(orderState, orderId) {
  // 型別轉換
  if(orderState === 'false') {
    orderState = false;
  } else if (orderState === 'true') {
    orderState = true;
  }
  const url = `${apiPath}/admin/${myPath}/orders`;
    
  let obj = {
    data: {
      id: orderId,
      paid: !orderState
    }
  }
  axios.put(url, obj, config).then((res) => {
    ordersData = res.data.orders;
    renderOrder();
    Swal.fire({
      showConfirmButton: false,
      confirmButtonColor: '#6A33F8',
      title: '已更改訂單狀態！',
      timer: 1200,
      icon: 'success',
    })

  }).catch((err) => {
    showError(err);
  })
}

// DELETE 刪除特定訂單
function deleteOrderItem(orderId) {
  Swal.fire({
    confirmButtonColor: '#6A33F8',
    cancelButtonText: '取消',
    showCancelButton: true,
    title: '確定要刪除該訂單嗎？',
    confirmButtonText: `確定`,
    icon: 'warning',
  }).then((result) => {
    if (result.isConfirmed) {
      const url = `${apiPath}/admin/${myPath}/orders/${orderId}`;
      axios.delete(url, config).then((res) => {
        ordersData = res.data.orders;
        renderOrder();
        Swal.fire({
          showConfirmButton: false,
          timer: 1500,
          title: '已刪除訂單！',
          icon: 'success',
        })
      }).catch((err) => {
        showError(err);
      })
    }
  })

}

// DELETE 刪除全部訂單
function deleteAllOrder(e) {
  e.preventDefault();
  if(ordersData.length === 0) {
    Swal.fire({
      title: '目前沒有訂單！',
      icon: 'warning',
    })
  } else {
    Swal.fire({
      confirmButtonText: `確定`,
      title: '確定要刪除所有訂單嗎？',
      showCancelButton: true,
      cancelButtonText: '取消',
      icon: 'warning',
      confirmButtonColor: '#6A33F8',
    }).then((result) => {
      if (result.isConfirmed) {
        const url = `${apiPath}/admin/${myPath}/orders`;
        axios.delete(url, config).then((res) => {
          if(res.data.status) { 
            Swal.fire({
              title:  `${res.data.message}`,
              icon: 'success',
              showConfirmButton: false,
              timer: 1500,
            })
            ordersData = res.data.orders;
            renderOrder();
          }
        }).catch((err) => {
          showError(err);
        })
      }
    })
  }
}

// 監聽
discardAllBtn.addEventListener('click', deleteAllOrder);
orderBody.addEventListener('click', doSomething);


getOrderList();