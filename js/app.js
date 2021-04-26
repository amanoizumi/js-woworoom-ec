// 產品列表 DOM
const productsWrap = document.querySelector('.js-productWrap');
// 產品下拉選單 DOM
const productSelect = document.querySelector('.js-productSelect');
// 購物車 DOM
const shoppingCartTable = document.querySelector('.shoppingCart-table');
const shoppingCart = document.querySelector('.js-shoppingCartBody');
const discardAllBtn = document.querySelector('.js-discardAllBtn');
const totalCost = document.querySelector('.js-totalCost');
const overflowWrap = document.querySelector('.overflowWrap');
const cartAlert = document.querySelector('.cart-alert');
// 表單 DOM
const inputs = document.querySelectorAll("input[name],select[data=payment]");
const form = document.querySelector('.orderInfo-form');

const createOrderBtn = document.querySelector('.orderInfo-btn');


// 資料
let productsData = [];
let filterTempArr = [];
let cartTotalData = {};


// 前台
function showError(err) {
  if(err.response.status === 400 || err.response.status === 403 || err.response.status === 404){
    Swal.fire({
        title:  `${err.response.data.message}`,
        icon: 'error',
        confirmButtonText: '確定',
      })
    }
  // 修正前
  // if(err.response.status === 400) {
  //   Swal.fire({
  //     title:  `${err.response.data.message}`,
  //     icon: 'error',
  //     confirmButtonText: '確定',
  //   })
  // } else if (err.response.status === 403) {
  //   Swal.fire({
  //     title:  `${err.response.data.message}`,
  //     icon: 'error',
  //     confirmButtonText: '確定',
  //   })
  // } else if (err.response.status === 404) {
  //   Swal.fire({
  //     title:  `${err.response.data.message}`,
  //     icon: 'error',
  //     confirmButtonText: '確定',
  //   })
  // }
}

function showSuccess(mes){
  Swal.fire({
    icon: 'success',
    showConfirmButton: false,
    timer: 1500,
    title: mes,
  })
}

function toCurrency(num){
  let parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// 取得產品列表(前台)
function getProducts() {
  const url = `${apiPath}/customer/${myPath}/products`;
  
  axios.get(url).then((res) => {
    productsData = res.data.products;
    renderProducts(productsData);
    renderSelect(productsData);
  }).catch((err) => {
    showError(err);
  })
}

// 渲染產品列表
function renderProducts(data) {
  // 渲染產品卡片
  let cardStr = ``;
    data.forEach((item) => {
    let originPrice = toCurrency(item.origin_price);
    let price = toCurrency(item.price);
    cardStr += `
    <li class="productCard">
      <h4 class="productType">新品</h4>
      <img src="${item.images}" alt="">
      <a href="" class="js-addCart" data-productId=${item.id}>加入購物車</a>
      <h3>${item.title}</h3>
      <del class="originPrice">NT$${originPrice}</del>
      <p class="nowPrice">NT$${price}</p>
    </li>`;
  });
  productsWrap.innerHTML = cardStr;
}

// 產品篩選器
function filterProduct(selected) {
  let value = selected.value;
  if(value === '全部') {
    renderProducts(productsData);
  } else {
    filterTempArr = [];
    productsData.forEach(item => {
      if(item.category === value) {
        filterTempArr.push(item);
      }
    });
    renderProducts(filterTempArr);
  }
}

// 渲染 SELECT
function renderSelect(data) {
  let selectBeforeStr =`<option value="全部" selected>全部</option>`;
  let selectItemStr = ``;
  let arr = [];
  data.forEach((item) => {
    arr.push(item.category);
  })
  let arrSet = new Set(arr);
  arr = [...arrSet];
  arr.forEach((item) => {
    selectItemStr += `<option value="${item}">${item}</option>`;
  });
  let selectStr = selectBeforeStr + selectItemStr;
  productSelect.innerHTML = selectStr;
}

// GET 取得購物車列表
function getCartList() {
  const url = `${apiPath}/customer/${myPath}/carts`;
  axios.get(url).then((res) => {
    cartTotalData = res.data;
    renderCart();
  }).catch((err) => {
    showError(err);
  })
}

// 渲染購物車內容
function renderCart() {
  let carts = cartTotalData.carts;
  let str = ``;
  if(carts.length === 0) {
    cartAlert.innerHTML = '購物車還沒有東西喔，來去逛逛吧 ～ ';
    shoppingCartTable.classList.add("d-none");
  } else {
    cartAlert.innerHTML = '';
    shoppingCartTable.classList.remove("d-none");

    carts.forEach((item) => {
      let productTotal = item.product.price * item.quantity;
      let price = item.product.price;
      productTotal = toCurrency(productTotal);
      price = toCurrency(price);

      str += `
      <tr>
      <td>
      <div class="cardItem-title">
          <img src="${item.product.images}" alt="">
          <p>${item.product.title}</p>
      </div>
      </td>
      <td>NT$${price}</td>
      <td>
      <div class="d-flex align-items-center">
      <span class="material-icons cart-icon" data-js="minus" data-cartid="${item.id}">remove</span>
      <span class="cart-value" value="${item.quantity}">${item.quantity}</span>
      <span class="material-icons cart-icon" data-js="plus" data-cartid="${item.id}">add</span>
      </div>
      </td>
      <td>NT$${productTotal}</td>
      <td class="discardBtn">
          <a href="#" class="material-icons" data-js="delete" data-cartid="${item.id}">
              clear
          </a>
      </td>
      </tr>`;
    });
    
    shoppingCart.innerHTML = str;
    let finalTotal = cartTotalData.finalTotal;
    finalTotal = toCurrency(finalTotal);
    totalCost.innerHTML = `NT$${finalTotal}`;
  }
}
// 加入購物車
function addCartItem(e) {
  e.preventDefault();
  const addCartClass = e.target.getAttribute('class');
  if(addCartClass !== 'js-addCart') {
    return;
  }
  const productId = e.target.getAttribute('data-productId');
  const url = `${apiPath}/customer/${myPath}/carts`;
  
  // 檢查點擊的商品是否已在購物車內
  let isProductExist = false;
  cartTotalData.carts.forEach((item) => {
    if (item.product.id === productId) {
      isProductExist = true;
    }
  });

  // 如果該商品存在，則
  if(isProductExist) {
    cartTotalData.carts.forEach((item)=>{
      if(item.product.id === productId) {
        let obj = {
          data: {
            productId: item.product.id,
            quantity: item.quantity + 1,
          }
        };
        axios.post(url, obj).then((res) => {
        cartTotalData = res.data;
        renderCart();
        showSuccess('購物車產品已增加數量！');
      }).catch((err) => {
        showError(err);
      })
      }
    })
  // 如果商品不存在，則
  } else {
    let obj = {
      data: {
        productId: productId,
        quantity: 1,
      }
    };
    axios.post(url, obj).then((res) => {
      cartTotalData = res.data;
      renderCart();
      showSuccess('商品已加到購物車！');
    }).catch((err) => {
      showError(err);
    })
  }
}

// 監聽購物車行為
function doSomething(e) {
  e.preventDefault();
  const doSomething = e.target.getAttribute('data-js');
  if (doSomething !== 'minus' && doSomething !== 'plus' && doSomething !== 'delete') {
    return;
  } else {
    const id = e.target.getAttribute('data-cartid');
    if (doSomething === 'delete') {
      deleteCartItem(id);
    } else if (doSomething === 'plus') {
      editCartItem(doSomething, id);
    } else if (doSomething === 'minus') {
      editCartItem(doSomething, id);
    }
  }
}

// PATCH 編輯購物車數量
function editCartItem(para, id) {
  let obj = {};
  const url = `${apiPath}/customer/${myPath}/carts`;
  if (para === 'plus') {
    cartTotalData.carts.forEach((item => {
      if(item.id === id) {
        obj = {
          data: {
            id: id,
            quantity: item.quantity + 1
          }
        }
      }
    }))
    axios.patch(url, obj).then(res => {
      cartTotalData = res.data;
      renderCart();
    }).catch(err => {
      showError(err);
    })
  }
  else if (para === 'minus') {
    cartTotalData.carts.forEach((item => {
      if(item.id === id && item.quantity > 1) {
        obj = {
          data: {
            id: id,
            quantity: item.quantity - 1
          }
        }
        axios.patch(url, obj).then(res => {
          cartTotalData = res.data;
          renderCart();
        }).catch(err => {
          showError(err);
        })
      }
      else if (item.id === id && item.quantity <= 1) {
        Swal.fire({
          icon: 'warning',
          showConfirmButton: false,
          timer: 1500,
          title: '商品數量不得少於一個！',
        })
      }
    }))
  }
}

// 清除購物車內全部產品
function deleteCartAll(e) {
  e.preventDefault();
  const url = `${apiPath}/customer/${myPath}/carts`;
  Swal.fire({
    title: '確定要清空購物車嗎？',
    confirmButtonColor: '#6A33F8',
    confirmButtonText: '確認',
    denyButtonText: '取消',
    icon: 'warning',
  }).then(result => {
    if (result.isConfirmed) {
      axios.delete(url).then((res) => {
        cartTotalData = res.data;
        renderCart();
        showSuccess('已清空購物車！');
      }).catch((err) => {
        showError(err);
      })
    }
  })
}

// 刪除購物車內特定產品
function deleteCartItem(id) {
  const url = `${apiPath}/customer/${myPath}/carts/${id}`;

  axios.delete(url).then((res) => {
    cartTotalData = res.data;
    renderCart();
    showSuccess('成功刪除該商品！');
  }).catch((err) => {
    showError(err);
  })
}

// 監聽產品列表
productsWrap.addEventListener('click', addCartItem);

// 監聽購物車項目
shoppingCart.addEventListener('click', doSomething);

// 監聽購物車清除全部
discardAllBtn.addEventListener('click', deleteCartAll);

// 表單
const constraints = {
  "姓名": {
    presence: {
      allowEmpty: false,
      message: "必填"
    }
  },
  "電話": {
    presence: {
      allowEmpty: false,
      message: "必填"
    },
    length: {
      minimum: 8,
      message: "需超過 8 碼"
    }
  },
  "Email": {
    presence: {
      allowEmpty: false,
      message: "必填"
    },
    email: {
      message: "格式錯誤"
    }
  },
  "寄送地址": {
    presence: {
      allowEmpty: false,
      message: "必填"
    }
  },
};

createOrderBtn.addEventListener('click', bindCheck);

function bindCheck() {
  if(cartTotalData.carts == undefined || cartTotalData.carts.length === 0){
    Swal.fire({
      title: '購物車還沒有東西唷！',
      confirmButtonColor: '#6A33F8',
      icon: 'warning',
    })
  } else {
    const tradeWay = document.querySelector('#tradeWay');
    let dataArr = [];

    inputs.forEach((item) => {
      dataArr.push(item.value);
      item.nextElementSibling.textContent = '';
    });

    let errors = validate(form, constraints) || '';
    if (errors) {
      let keysArr = Object.keys(errors);
      keysArr.forEach((item) => {
        document.querySelector(`[data-message="${item}"]`).textContent = errors[item];
      })
      checkFormAgain();
    }  else if (errors === '') {
      dataArr.push(tradeWay.value);
      createOrder(dataArr);
    }
  }
}
// 第一次送出表單失敗後，綁上 change 的函式
function checkFormAgain() {
  inputs.forEach((item) => {
    item.addEventListener("change", () => {
      item.nextElementSibling.textContent = '';
      let errors = validate(form, constraints) || '';
      if (errors) {
        Object.keys(errors).forEach((keys) => {
          document.querySelector(`[data-message="${keys}"]`).textContent = errors[keys];
        })
      }
    });
  });
}

// 送出購買訂單
function createOrder(dataArr) {
  // 客戶資料
  let userData = {
    name: dataArr[0],
    tel: dataArr[1],
    email: dataArr[2],
    address: dataArr[3],
    payment: dataArr[4]
  };

  let str = `
  <table class="order-table">
  <tr>
    <th>姓名：</th>
    <td>${userData.name}</td>
  </tr>
  <tr>
    <th>電話：</th>
    <td>${userData.tel}</td>
  </tr>
  <tr>
    <th>Email：</th>
    <td>${userData.email}</td>
  </tr>
  <tr>
    <th>寄送地址：</th>
    <td>${userData.address}</td>
  </tr>
  <tr>
    <th>交易方式：</th>
    <td>${userData.payment}</td>
  </tr>
  </table>
  `;

  Swal.fire({
        title: '確定送出訂單嗎？',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: `確認送出`,
        cancelButtonText: `取消`,
        confirmButtonColor: '#6A33F8',
        html: str,
      }).then((result) => {
        if(result.isConfirmed) {
          const url = `${apiPath}/customer/${myPath}/orders`;
          const obj = {
            data: {
              user: {
                ...userData,
              }
            }
          }
          axios.post(url, obj).then((res) => {
            // 刷新購物車
            getCartList();
            showSuccess('成功送出訂單！');
            form.reset();
          }).catch((err) => {
            showError(err);
          })
        }
      })
}
// 初始化
getProducts();
getCartList();
