/* This file primarily contains code for interfacing with the Database (insert and retreival functions)
*/
const express = require('express');

//const mysql = require('mysql');
const pg=require('pg');

//const mysql = new pg.Client(connectionString);
//mysql.connect();

const fs = require('fs');

const app=express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//session code
const cookieParser = require('cookie-parser');
var session = require('express-session');

app.use(cookieParser());
app.use(session({secret:'secr3',resave:false,saveUninitialized:false, maxAge: 24 * 60 * 60 * 1000}));

//end of session code

const url = require('url');

const configuration=require('./Configuration');



//--USER/Costumer---

/* function for handling  http authentication requests
to the portal, the credentials are store in Customer table */
exports.verifyUser=function(req,res){
  let userId=req.body.userId;
  let password=req.body.password;
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  var sql = "SELECT count(*) as count FROM Customer where id=$1 and password=$2";

  pool.query(sql, [userId,password], function (err, result, fields){
    if(result.rows[0].count=="0"){
      res.render('index.ejs', {userId: undefined,errorMsg:"User Id/password error"});
    }
    else{
      req.session.userId=userId;
      ///console.log(req.session);
      res.render('index.ejs', {userId: req.session.userId,errorMsg:null});
    }
  });
}


/*Api Json version of verify user*/
exports.verifyUserJson=function(req,res){
  let userId=req.body.userId;
  let password=req.body.password;
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  var sql = "SELECT count(*) as count, max(case when admin=true then 1 else 0 end) as admin "+
            "FROM Customer where id=$1 and password=$2";

  pool.query(sql, [userId,password], function (err, result, fields){
    let resObj={};
    if(result.rows[0].count=="0"){
      resObj={"login":"failure"};
    }
    else{
      resObj={"login":"ok", "admin": result.rows[0].admin};
    }
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    res.json(resObj);
  });
}



/* function for handling  http requests to insert a record to the
 Customer table in database*/
exports.insertUserToDB=function(req,res){
  let userId=req.body.userId;
  let password=req.body.password;
  let firstName=req.body.firstName;
  let lastName=req.body.lastName;
  let address1=req.body.address1;
  let address2=req.body.address2;
  let city=req.body.city;
  let zip=req.body.zip;
  let phone=req.body.phone;
  let cell=req.body.cell;
  let email=req.body.email;

  console.log('in inserting user to db');
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  var sql = "insert into Customer(id,password,first_name,last_name,address1,address2,city,zip,phone,mobile,email) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)";

  pool.query(sql, [userId,password,firstName,lastName,address1,address2,city, zip, phone,cell,email], (err,result)=>
  {
    if (err) throw err;
    console.log("1 record inserted");
    res.render('insertUser', {message: 'User Inserted',userId:req.session.userId});
  });
}

/* Api verison of InsertUserToDB in database*/
exports.insertUserToDbJson=function(req,res){
  let userId=req.body.userId;
  let password=req.body.password;
  let firstName=req.body.firstName;
  let lastName=req.body.lastName;
  let address1=req.body.address1;
  let address2=req.body.address2;
  let city=req.body.city;
  let zip=req.body.zip;
  let phone=req.body.phone;
  let cell=req.body.cell;
  let email=req.body.email;

  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  var sql = "insert into Customer(id,password,first_name,last_name,address1,address2,city,zip,phone,mobile,email) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)";

  pool.query(sql, [userId,password,firstName,lastName,address1,address2,city, zip, phone,cell,email], (err,result)=>
  {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    if (err){
      throw err;
      res.json({"insertstatus":"error"});
    }
    else{
      res.json({"insertstatus":"ok"});
    }
  });
}

/* function for handling  http requests to retrive and display the records in the
 Customer table in database*/
exports.displayUsers=function(req,res){
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });
  var sql = "SELECT id,first_name,last_name,address1,address2,city,zip,phone,mobile,email FROM Customer";
  pool.query(sql, function (err, result, fields){
    if (err) throw err;

    var str= '<!DOCTYPE html><head>'+
    '<meta charset="utf-8">'+
    '<title>Browse Users</title>'+
    '<link rel="stylesheet" type="text/css" href="css/style.css">'+
    '</head>'+
    '<body>';
    if(req.session.userId)
    str+='<div w3-include-html="headerLogged"></div>';
    else
    str+='<div w3-include-html="header.ejs"></div>';
    str+='<a class="HomeLink" href="/">back to home</a>'+
    '<div class="h1">'+
    'Browse Users'+
    '</div>'+
    '<table style="width:100%">'+
    '<tr>'+
    '<th>id</th><th>full name</th><th>address</th><th>city</th><th>zip</th><th>phone</th><th>mobile</th><th>email</th>'+
    '</tr>';
    var i=0;
    for(i=0;i<result.rows.length;i++){
      str+='<tr><td><a href="./showTheUser?id='+result.rows[i].id+'">'+result.rows[i].id+'</a></td>'+
      '<td>'+result.rows[i].first_name+' '+result.rows[i].last_name+'</td>'+
      '<td>'+result.rows[i].address1+' '+result.rows[i].address2+'</td>'+
      '<td>'+result.rows[i].city+'</td>'+'<td>'+result.rows[i].zip+'</td>'+
      '<td>'+result.rows[i].phone+'</td>'+'<td>'+result.rows[i].mobile+'</td>'+
      '<td>'+result.rows[i].email+'</td>'+
      '</tr>';
    }
    str+='</table>'+
    '</body>' +
    '<script type="text/javascript" src="scripts/general.js">'+
    '</script>';
    res.send(str);
  });
}

/* function for handling  http requests to retrive list of users in database
in json format*/
exports.getUsers=function(req,res){
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });
  var sql = "SELECT id,first_name,last_name,address1,address2,city,zip,phone,mobile, "+
  " email FROM Customer  where deleted=false ";
  pool.query(sql, function (err, result, fields){
    if (err) throw err;

    var arrResult=[]

    var i=0;
    for(i=0;i<result.rows.length;i++){
      arrResult.push(result.rows[i]);
    }

    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    res.send(arrResult);
  });
}

exports.getTheUser=function(req,res){
  let userId=req.body.userId;
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  var sql = "select first_name, last_name, address1, address2, city, zip, phone, mobile, email from customer where id = '"+userId+"'";

  pool.query(sql, function(err,result,fields){
    if (err) throw err;

    let resObj={};

    resObj.firstName=result.rows[0].first_name;
    resObj.lastName=result.rows[0].last_name;
    resObj.address1=result.rows[0].address1;
    resObj.address2=result.rows[0].address2;
    resObj.city=result.rows[0].city;
    resObj.zip=result.rows[0].zip;
    resObj.phone=result.rows[0].phone;
    resObj.mobile=result.rows[0].mobile;
    resObj.email=result.rows[0].email;

    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    res.json(resObj);
  });
}

/*api method for updating a course*/
exports.editUserInDbJson=function(req,res){
  //var q = url.parse(req.url, true).query;
  let id=req.body.id;
  let firstName=req.body.firstName;
  let lastName=req.body.lastName;
  let address1=req.body.address1;
  let address2=req.body.address2;
  let city=req.body.city;
  let zip=req.body.zip;
  let phone=req.body.phone;
  let mobile=req.body.mobile;
  let email=req.body.email;

  var sql="UPDATE CUSTOMER SET  first_name=$1, last_name=$2, address1=$3, address2=$4, city=$5, "+
  " zip=$6, phone=$7, mobile=$8, email=$9, modified_timestamp=now() "+
  " where id=$10 ";

  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

  pool.query(sql, [firstName, lastName, address1, address2, city, zip, phone, mobile, email, id], function (err, result, fields){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    if (err) {
      throw err;
      res.json({"updatestatus":"error"});
    }
    else{
      //console.log(description+' '+solution);
      console.log("user updated");
      res.json({"updatestatus":"ok"});
    }
  });

}

/* function for handling  http requests to show details about a selected User*/
exports.showTheUser=function(req,res){

  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });

var q = url.parse(req.url, true).query;
let userId=q.id;

var sql = "select first_name, last_name, city, phone, mobile, email from customer where id = '"+userId+"'";
console.log(' param '+q.id);
pool.query(sql, function(err,result,fields){

  var str= '<!DOCTYPE html><head>'+
  '<meta charset="utf-8">'+
  '<title>Show Individual User</title>'+
  '<link rel="stylesheet" type="text/css" href="css/style.css">'+
  '</head>'+
  '<body>';
  if(req.session.userId)
  str+='<div w3-include-html="headerLogged"></div>';
  else
  str+='<div w3-include-html="header.ejs"></div>';

  str=str+'<a class="HomeLink" href="/">back to home</a>'+
  '<div class="h1">'+
  'Name: '+result.rows[0].first_name+' '+result.rows[0].last_name+
  '</div>';

  str+='<p> City: '+result.rows[0].city+'</b><br/>'+
  '<b> Phone:'+result.rows[0].phone+' Mob: '+result.rows[0].mobile+'</b>';
  str+='<br/>Email: '+result.rows[0].email;

  str+='<div class="row">';
  str+='<div class="LeftWindow"></br><b>List of Courses:</b></br></br>';
  var getResultPromise=getCourseListForUser(userId);
  getResultPromise.then(function(courseList){
    for(var i=0;i<courseList.length;i++){
      var index=courseList[i].indexOf('$,');
      var valCourse=courseList[i].substring(index+2);
      var textCourse=courseList[i].substring(0,index);
      str+='<a href="./showTheCourse?id='+valCourse+'\">'+textCourse+"</a>";
      if(i<courseList.length-1)
         str+="</br>";
      console.log(valCourse+' , '+textCourse);
    }
    str+='</div>';//end of left window
    str+='</div>';//end of row
      str+='</body>';
      str+='<script type="text/javascript" src="scripts/general.js">'+
      '</script>';
      res.send(str);
  },function(err){
    str+='</div>';//end of left window
    str+='</div>';//end of row
      str+='</body>';
      str+='<script type="text/javascript" src="scripts/general.js">'+
      '</script>';
      res.send(str);
  });
  });
}

exports.getCourseListForUserJson=function(req,res){
    let userId=req.body.userId;
    var getResultPromise=getCourseListForUser(userId);
    var resArr=[];
  getResultPromise.then(function(courseList){
    for(var i=0;i<courseList.length;i++){
      var index=courseList[i].indexOf('$,');
      var valCourse=courseList[i].substring(index+2);
      var textCourse=courseList[i].substring(0,index);
      obj={
        "id": valCourse,
        "name": textCourse
      }
      resArr.push(obj);
    }
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
    res.setHeader('Access-Control-Allow-Credentials',true);
    res.json(resArr);
  },function(err){
      res.setHeader('Access-Control-Allow-Origin','*');
      res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers','Content-Type');
      res.setHeader('Access-Control-Allow-Credentials',true);
      res.send(resArr);
  });
}




/* function for return a Promise object that retrives the set of records in the
 Course table in database related to a selected user */
function getCourseListForUser(userId){
  var courseList=[];
  var pool = new pg.Pool({
    host: configuration.getHost(),
    user: configuration.getUserId(),
    password: configuration.getPassword(),
    database: configuration.getDatabase(),
    port:configuration.getPort(),
    ssl:true
  });
  var sql = "SELECT id,name FROM Course where author_id=$1  and deleted=false ";
  return new Promise(function(resolve,reject){
    pool.query(sql, [userId], function (err, result, fields){
      if (err)
            reject(err);
      else{
        var i=0;
        for(i=0;i<result.rows.length;i++){
          courseList.push(result.rows[i].name+'$,'+result.rows[i].id);
        }
        resolve(courseList);
      }
    });
  });
}
exports.getCourseListForUser=getCourseListForUser;
