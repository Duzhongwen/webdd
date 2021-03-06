/*
 * GET home page.
 */
var moment = require('../public/moment');
var Shop = require('../models/shopping.js');
var Rule=require('../models/discounts');
var _ = require('../public/underscore');

module.exports = function(app) {
    app.get('/', function (req, res) {
        if (req.session.cart) {
            req.session.cart = [];
        }
        if (req.session.total) {
            req.session.total = 0;
        }
        res.render('index', { title: '主页', total: req.session.total });
    });
    app.get('/Product_list', function (req, res) {
        Shop.get(function (err, products) {
            var product = products;
            if (err) {
                product = [];
            }
            res.render('Product_list', {
                title: "商品列表",
                total: req.session.total,
                products: product
            });
        });
    });
    app.post('/addCart', function (req, res) {
        var shop = req.body.product;
        var shop_car = req.session.cart;
        var shop_thing = _.findWhere(shop_car, {'name': shop.name});
        if (shop_thing != undefined) {
            shop.num = shop_thing.num + 1;
            var index = _.indexOf(shop_car, shop_thing);
            shop_car[index] = shop;
        } else {
            shop.num = 1;
            shop_car.push(shop);
        }
        req.session.cart = shop_car;
        req.session.total += 1;
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write(req.session.total + '');
        res.end();
    });

    app.get('/less', function (req, res) {
        var cart = req.session.cart;
        var name = req.query.name;
        var product = _.findWhere(cart, {'name': name});
        if (product.num > 0) {
            req.session.total -= 1;
            product.num -= 1;
        } else {
            product.num = 0;
        }
        if (req.session.total < 1) {
            req.session.total = 0;
        }
        req.session.cart = cart;
        if (req.session.total == 0) {
            req.session.cart = [];
            res.redirect('/Product_list');
        } else {
            res.redirect('/Shop_cat');
        }
    });

    app.get('/add', function (req, res) {
        var cart = req.session.cart;
        var name = req.query.name;
        var product = _.findWhere(cart, {'name': name});
        product.num += 1;
        req.session.total += 1;
        req.session.cart = cart;
        res.redirect('/Shop_cat');
    });

    app.get('/Shop_cat', function (req, res) {
        res.render('Shop_cat', {
            title: '购物车',
            total: req.session.total,
            products: req.session.cart
        });
    });
    app.get('/Payment', function (req, res) {
        var cart = req.session.cart;
        var free = [];
        _.each(cart, function (list) {
            if (list.discounts == 'true' && list.num > 2) {
                var frees = _.clone(list);
                frees.num = parseInt(frees.num / 3);
                free.push(frees);
            }
        });
        res.render('Payment', {
            title: '付款 ',
            total: req.session.total,
            products: req.session.cart,
            free_product: free
        });
    });
    app.get('/pay', function (req, res) {
        var cart = req.session.cart;
        Shop.get(function (err, products) {
            var product = products;
            if (err) {
                product = [];
            }
            _.each(cart, function (list) {
                var productes= _.findWhere(product,{'商品名称':list.name});
                var num=productes.数量-list.num;
                if(num>=0) {
                    Shop.update(productes._id, num, function (err) {
                        if (err) {
                            req.flash('error', err);
                        }
                        req.session.total = 0;
                        req.session.cart = [];
                        res.redirect('/Product_list');
                    });
                }
            });
        });
    });
    app.get('/admin', function (req, res) {
        if (!req.session.property) {
            req.session.property = [];
        }
        if(!req.session.p){
            req.session.p = [];
        }
        var page = req.query.p ? parseInt(req.query.p) : 1;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            Shop.getTen(page,function(err,product,total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/admin');
                }
                res.render('Background/admin', {
                    products: product,
                    title: "商品信息管理",
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1)*10 + product.length) == total,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/add_num', function (req, res) {
        var name = req.query.name;
        var num = req.query.number;
        num = parseInt(num) + 1;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products=_.findWhere(product, {'商品名称': name});
            console.log(products);
            Shop.update(products._id, num, function (err) {
                if (err) {
                    console.log(err);
                    req.flash('error', err);
                }
                res.redirect('/admin');
            });
        });
    });

    app.get('/less_num', function (req, res) {
        var name = req.query.name;
        var num = req.query.number;
        if (num <= 0) {
            num = 0;
        } else {
            num = parseInt(num) - 1;
        }
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product, {'商品名称': name});
            console.log(products);
            Shop.update(products._id, num, function (err) {
                if (err) {
                    req.flash('error', err);
                }
                res.redirect('/admin');
            });
        });
    });

    app.get('/add_rule',function(req,res) {
        res.render('Background/add_rule',{
            title:"添加规则"
        });
    });

    app.post('/add_rule',function(req,res){
        var rule= req.body.rule.replace(/[\s"']/g,'');//获取规则
        var indexofdate= rule.indexOf('day');
        var time = moment(rule.slice(indexofdate+4),"MM/DD/YYYY").valueOf();//获取打折商品时间
        var maxmin = rule.slice(indexofdate+3,indexofdate+4);
        var nameInfo = rule.split("&&")[0];
        nameInfo=nameInfo.split("||");//得到打折商品名
        var price=0;
//       Shop.get(function (err, product) {
//       if (err) {
//            product = [];
//       }
//       var products=_.findWhere(product,{'商品名称':nameInfo.slice(6)});
//          var a =nameInfo.slice(6);
//           console.log('1111111111111111111111111111111111111111111111111111');
//           console.log(a);
//           console.log('2222222222222222222222222222222222222222222222222222');
//       price=products.价格;
        var namearray = [];
        _.each(nameInfo,function(body){
            namearray.push({name:body.slice(6),day:time});
            var starttime =req.body.start_time;
            //var endtime = moment(req.body.end_time,"MM/DD/YYYY").valueOf();
            var endtime = req.body.end_time;
            var buy = parseInt(req.body.buy);
            var free = parseInt(req.body.free);
            var newrule = new Rule(body.slice(6),starttime,endtime,buy,free,price);
            newrule.save();
        });
        res.redirect('/admin');
//       });
    });

    app.get('/discount',function(req,res){
        Rule.get(function (err, rules) {
            if (err) {
                rules = [];
            }
            var allDiscounts = {};
            if(rules == null){
                allDiscounts = null;
            }else{
                allDiscounts = rules;
            }
            console.log(allDiscounts);
            res.render('Background/discount', {
                title: "打折活动",
                allDiscounts:allDiscounts
            });
        });
    });

    app.get('/add_product', function (req, res) {
        if(!req.session.number){
            req.session.number=0;
        }
        res.render('Background/add_product', {
            title: "添加商品",
            properties: req.session.property,
            product_num:req.session.number
        })
    });
    app.post('/add_product', function (req, res) {
        var name = req.body.name,
            price = req.body.price,
            unit = req.body.unit,
            num = req.body.num,
            properties = req.session.property;
        var shop = new Shop({
            name: name,
            price: price,
            unit: unit,
            num: num
        });
        req.session.number=shop.num;
        var add_property = {};
        if (properties.length != 0) {
            properties.forEach(function (value) {
                add_property[value.name] = req.body[value.name];
            });
        }
        if (shop.num <= 0) {
            req.flash('failure', "请确认商品数目");
            res.redirect('/add_product');
        } else {
            shop.save(add_property, function (err) {
                if (err) {
                    req.flash('error', err);
                    res.redirect('/add_product');
                }
                req.session.number=0;
                req.flash('success', "商品保存成功");
                res.redirect('/admin');
            });
        }
        req.session.property = properties;
    });
    app.get('/lower_shop_number',function(req,res) {
        var number= req.session.number;
        number -= 1;
        if(number<=0) {
            number = 0;
        }
        req.session.number = number;
        res.redirect('/add_product');
    });
    app.get('/add_shop_number',function(req,res) {
        var number= req.session.number;
        number = number+ 1;
        req.session.number = number;
        res.redirect('/add_product');
    });
    app.get('/delete', function (req, res) {
        var name = req.query.name;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product, {商品名称: name});
            Shop.deletes(products._id, function (err) {
                if (err) {
                    req.flash('error', err);
                    res.redirect('/admin');
                }
                req.flash('success', "商品删除成功");
                res.redirect('/admin');
            });
        });
    });
    app.get('/add_properties', function (req, res) {
        res.render('Background/add_properties', {
            title: "添加属性"
        })
    });
    app.post('/add_properties', function (req, res) {
        var name = req.body.name;
        var value = req.body.value;
        var properties = req.session.property;
        var property = { name: name,
                         value: value };
        properties.unshift(property);
        req.session.property = properties;
        res.redirect('/add_product');
    });
    app.get('/delete_property', function (req, res) {
        res.render('Background/delete_property', {
            title: "删除属性",
            property: req.session.property
        })
    });
    app.get('/delete_properties', function (req, res) {
        var property_name = req.query.names;
        var property = req.session.property;
        var properties = _.indexOf(property, _.findWhere(property, {'name': property_name}));
        property.splice(properties, 1);
        req.session.property = property;
        res.redirect('/add_product');
    });
    app.get('/detail_product', function (req, res) {
        var product_name = req.query.name||req.session.products;
        var property=req.session.p;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product,{商品名称:product_name});
            var length=_.size(products);
            req.session.products = product_name;
            res.render('Background/detail_product',{
                title: "商品详情",
                this_product: products,
                length:length,
                property:property
            })
        });
    });
    app.post('/detail_product',function(req,res) {
        var property = req.body;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var product_name = req.session.products;
            var products = _.findWhere(product, {"商品名称": product_name});
            var _id='_id';
            property[_id]=products._id;
            Shop.updata_product_property(products._id, property, function (err) {
                if (err) {
                    return res.redirect('/detail_product');
                }
                res.redirect('/admin');
            })
        });
    });
    app.get('/delete_product_property',function(req,res) {
        var product_name = req.session.products;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product, {"商品名称": product_name});
            console.log(products);
            var length=_.size(products);
            res.render('Background/delete_product_property', {
                title: "商品详情",
                product_name: product_name,
                this_product:products,
                length:length
            })
        })
    });
    app.get('/add_product_properties',function(req,res) {
        var product_name = req.session.products;
        res.render('Background/add_product_properties', {
            product_name: product_name,
            title: "添加属性"
        })
    });
    app.post('/add_product_properties',function(req,res){
        var name = req.body.name;
        var value = req.body.value;
        var product_name = req.session.products;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product, {"商品名称": product_name});
            products[name]=value;
            Shop.updata_product_property(products._id,products,function (err) {
                if(err){
                    console.log(err);
                    return res.redirect('/admin');
                }
                res.redirect('/detail_product');
            });
        })
    });
    app.get('/delete_shop_property',function(req,res) {
        var value = req.query.name,
            product_name = req.query.product_name;
        Shop.get(function (err, product) {
            if (err) {
                product = [];
            }
            var products = _.findWhere(product, {"商品名称": product_name});
            var shop = _.omit(products,value);
            Shop.updata_product_property(products._id,shop,function(err){
                if(err){
                    return res.redirect('/admin');
                }
                res.redirect('/detail_product');
            })
        })
    });
};