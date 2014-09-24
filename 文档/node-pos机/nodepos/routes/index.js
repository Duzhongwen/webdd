/*
 * GET home page.
 */

var Shop = require('../models/shopping.js');
var _ = require('../public/underscore');

module.exports = function(app) {
  app.get('/', function (req, res) {
      if(!req.session.cart){
          req.session.cart = [];
      }
      if(!req.session.total){
          req.session.total = 0;
      }
    res.render('index', { title: '主页' ,total:req.session.total });
  });
  app.get('/Product_list', function (req, res) {
      Shop.get(function(err,products){
          var product = products;
          if(err){
              product = [];
          }
          res.render('Product_list',{
              title:"商品列表",
              total:req.session.total,
              products:product
          });
      });
  });
  app.post('/addCart',function(req,res){
      var shop = req.body.product;
      console.log(shop);
      var shop_car=req.session.cart;
      var shop_thing = _.findWhere(shop_car,{'name':shop.name});
      if(shop_thing!=undefined){
          shop.num=shop_thing.num+1;
          var index = _.indexOf(shop_car,shop_thing);
          shop_car[index] = shop;
      }else{
          shop.num=1;
          shop_car.push(shop);
      }
      req.session.cart = shop_car;
      console.log(req.session.cart);
      req.session.total += 1;
      res.writeHead(200,{"Content-Type":"text/plain"});
      res.write(req.session.total+'');
      res.end();
    });

  app.get('/less',function(req,res){
      var cart=req.session.cart;
      var name=req.body.name;
      console.log(req.query.product.name+"----------------------------------------");
      var product= _.findWhere(cart,{'name':name});
      if(product.num>0){
        product.num -= 1;
      }else{
        product.num=0;
      }
      req.session.cart=cart;
      if(req.session.total==0){
          res.redirect('/Product_list');
      }
    });

  app.get('/Shop_cat', function (req, res) {
    console.log(req.session.cart);
    res.render('Shop_cat', {
       title: '购物车',
       total:req.session.total,
       products:req.session.cart
    });
  });
  app.get('/Payment', function (req, res) {
   res.render('Payment', { title: '付款 ',total:req.session.total });
  });
};
