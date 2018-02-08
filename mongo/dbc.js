/**
 * Created with JetBrains WebStorm.
 * User: Datlb
 * Date: 13-3-30
 * Time: 下午1:44
 * To change this template use File | Settings | File Templates.
 */

//var db = require('mongoskin').db('localhost:27017/caogen',{safe:true});
var settings=require('../settings');
var mongoskin = require('mongoskin');
exports.dbc = mongoskin.db(settings.host,{safe:true});