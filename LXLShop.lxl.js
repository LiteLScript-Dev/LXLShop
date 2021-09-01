/*
 *
 * LXLShop
 *
 * Copyright (C) 2021 LXLDev
 *
 * This program is free software. you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http.//www.gnu.org/licenses/>.
 *
 *
 */

///////////////////////////////////////////////////////////
//                         Config                        //
///////////////////////////////////////////////////////////

dir = './plugins/LXLShop/'
if(file.exists(dir)==false){
    file.mkdir(dir) 
    file.writeTo(dir+'data.json','{"sell":{},"rece":{},"listtype":[]}')
}
	
var cfg = data.parseJson(file.readFrom(dir+'data.json'))
var seeing = {}

//清除原lua版
if(file.exists("plugins/LXLShop.lxl.lua"))
    file.delete("plugins/LXLShop.lxl.lua");

Array.prototype.remove = function(val) {
    var index = this.indexOf(val)
    if (index > -1) {
        this.splice(index, 1)
    }
}

logger.setTitle("LXLShop");


///////////////////////////////////////////////////////////
//                          Money                        //
///////////////////////////////////////////////////////////

//  0为计分板，1为LLMoney
const mode = 0

function get_money(pl){
	if(mode ==0)
		return pl.getScore("money")
	else if (mode ==1 )
		return money.get(pl.xuid)
}

function add_money(pl,sc){
    if(mode==0)
		pl.addScore('money',sc)
	else if (mode ==1)
		money.add(pl.xuid,sc)
}
	


function remove_money(pl,sc){
    if(mode==0)
        pl.setScore("money",pl.getScore("money")-sc)
    else if (mode ==1)
        money.reduce(pl.xuid,sc)
}



function get_money_mode(){
	if(mode ==0)
		return "scoreboard"
	else if (mode==1)
		return "LLMoney"
}


///////////////////////////////////////////////////////////
//                          Items                        //
///////////////////////////////////////////////////////////

function count_item(pl,it){
    var  c = 0
    var plit = pl.getInventory().getAllItems()
    for(var itt in plit){
        if(plit[itt].type==it.ittype && plit[itt].aux == it.itaux){
            var vt = plit[itt].getNbt().removeTag("Damage").removeTag('Count')
            var kt = NBT.parseSNBT(it.nbt).removeTag("Damage").removeTag('Count')
            if(vt.toString() == kt.toString()){
                c = c + plit[itt].count
            }
        }
    }
    return c
}
		
function remove_item(pl,it,count){
    var plit = pl.getInventory().getAllItems()
    for(var itt in plit){
        if(plit[itt].type == it.ittype && plit[itt].aux == it.itaux){
            var vt = plit[itt].getNbt().removeTag("Damage").removeTag('Count')
			var kt = NBT.parseSNBT(it.nbt).removeTag("Damage").removeTag('Count')
            if(vt.toString() == kt.toString()){
                if(plit[itt].count > count){
                    logger.info("清除玩家"+itt+"格中的物品"+count+"个");
					pl.getInventory().removeItem(Number(itt),Number(count))
                }else{
                    count = count - plit[itt].count
					pl.getInventory().removeItem(Number(itt),Number(plit[itt].count))
					if(count == 0){
						break
                    }
                }
            }
        }
    }
    pl.refreshItems()
}
			
function add_item(item,pl,count){
    while(count>0){
        pl.giveItem(mc.newItem(NBT.parseSNBT(item)))
        count = count -1
    }
}

function save(){
    file.writeTo(dir+'data.json',data.toJson(cfg))
}
	

function class_is_include(value){
    for( v in cfg.listtype){
        if(v == value){
            return true
        }
            
    }
    return false
}

//############################## Set Shop ##############################//

///////////////////////////////////////////////////////////
//                      SetShop Forms                    //
///////////////////////////////////////////////////////////

function mainf(){
    var f = mc.newSimpleForm()
	f.setTitle('setshop')
	f = f.setContent('choose...')
	f = f.addButton('添加商品分类')
	f = f.addButton('添加出售商品')
	f = f.addButton('添加回收商品')
	f = f.addButton('移除商品分类')
	f = f.addButton('移除出售商品')
	f = f.addButton('移除回收商品')
	return f
}

function addclassf(){
    var f =mc.newCustomForm()
	f = f.setTitle('添加商品')
	f = f.addInput('输入商品分类名称')
	return f
}

function removeclassf(){
    var f =mc.newCustomForm()
	f = f.setTitle('移除商品分类')
	f = f.addDropdown("选择分类",cfg.listtype)
	return f
}

function additemf(){
    var f =mc.newCustomForm()
	f = f.setTitle('添加商品')
	f = f.addInput('输入商品名称')
	f = f.addInput('输入商品价格')
	f = f.addDropdown('选择商品分类',cfg.listtype)
	return f
}

function removesellf(){
    var f =mc.newCustomForm()
	f = f.setTitle('移除出售商品')
	f = f.addDropdown("选择移除的商品",getAllSell())
	return f
}

function removerecef(){
    var f =mc.newCustomForm()
	f = f.setTitle('移除回收商品')
	f = f.addDropdown("选择移除的商品",getAllRece())
	return f
}


///////////////////////////////////////////////////////////
//                      SetShop Class                    //
///////////////////////////////////////////////////////////

function addclass(pl,da){
    if(da==null) return
    if(String(da[0])!=""){
        if(class_is_include(da[0])){
            pl.tell("[§cLXLShop§r] 已经有同名商品分类了！")
            return
        }
        cfg.listtype.push(da[0])
        pl.tell('[§cLXLShop§r] 商品分类添加成功')
        save()
    }else{
        pl.tell('[§cLXLShop§r] 输入数据格式有误')
    }
}

//删除所有指定分类下的物品
function delclass(c){
    for(var v in cfg.rece){
        if(v.type ==c){
            delete cfg.rece.v
        }
    }
    for(var v in cfg.sell){
        if(v.type ==c){
            delete cfg.sell.v
        }
    }
}

function removeclass(pl,da){
    if(da!=null){
        delclass(cfg.listtype[da[0]])
		cfg.listtype.remove[da[0]]
		pl.tell("[§cLXLShop§r] 分类移除成功")
		save()
    }
}


///////////////////////////////////////////////////////////
//                      SetShop Sell                     //
///////////////////////////////////////////////////////////

function addsellitem(pl,dat){
    if(dat!=null && pl.getHand().isNull() != true){
        var it = pl.getHand().getNbt()
        if(isNaN(Number(dat[1]))!= true)
        {
            if(Number(dat[1]) <1){
                pl.tell("[§cLXLShop§r] 价格要大于0!")
                return
            }else{
                var t = {}
                t.itaux = pl.getHand().aux
                t.ittype = pl.getHand().type
                t.price = Number(dat[1])
                t.nbt = it.setByte('Count',1).toSNBT()
                t.type = cfg.listtype[dat[2]]
                cfg.sell[String(dat[0])] = t
                pl.tell('[§cLXLShop§r] 出售商品添加成功')
                save()
            }
        }else{
        pl.tell('[§cLXLShop§r] 输入数据格式有误')
        }
    }
}

function removesell(pl,dt){
    if(dt!=null){
        delete cfg.sell[getAllSell()[Number(dt[0])]]
		save()
		pl.tell("[§cLXLShop§r] 出售商品移除成功")
    }
}

function getAllSell(){
    var s = []
	for (var v in cfg.sell){
        s.push(v)
    }
	return s
}

///////////////////////////////////////////////////////////
//                     SetShop Receive                   //
///////////////////////////////////////////////////////////

function addreceitem(pl,dat){
    if(dat!=null && pl.getHand().isNull() != true){
        var it = pl.getHand().getNbt()
        if(isNaN(Number(dat[1]))!= true){
            if(Number(dat[1]) <1){
                pl.tell("[§cLXLShop§r] 价格要大于0!")
                return
            }else{
                var t = {}
                t.itaux = pl.getHand().aux
                t.ittype = pl.getHand().type
                t.price = Number(dat[1])
                t.nbt = it.setByte('Count',1).toSNBT()
                t.type = cfg.listtype[dat[2]]
                cfg.rece[String(dat[0])] = t
                pl.tell('[§cLXLShop§r] 回收商品添加成功')
                save()
            }
        }else{
        pl.tell('[§cLXLShop§r] 输入数据格式有误')
        }
    }
}

function removerece(pl,dt){
	if(dt!=null){
        delete cfg.rece[getAllRece()[Number(dt[0])]]
		save()
		pl.tell("[§cLXLShop§r] 回收商品移除成功")
    }
}

function getAllRece(){
    var s = []
	for (var v in cfg.rece){
        s.push(v)
    }
	return s
}


///////////////////////////////////////////////////////////
//                      SetShop Main                     //
///////////////////////////////////////////////////////////

function main(pl,id){
    if(id != null){
        if(id == 0)
			pl.sendForm(addclassf(),addclass)
		else if(id == 1){
            if(cfg.listtype.length >0){
                pl.sendForm(additemf(),addsellitem)
            }
				
			else{
                pl.tell('[§cLXLShop§r] 还没有商品分类呢')
            }
				
        }
		else if(id == 2){
            if(cfg.listtype.length >0){
                pl.sendForm(additemf(),addreceitem)
            }
				
			else{
                pl.tell('[§cLXLShop§r] 还没有商品分类呢')
            }
				
        }
        else if(id == 3){
            pl.sendForm(removeclassf(),removeclass)
        }
			
		else if(id == 4){
            pl.sendForm(removesellf(),removesell)
        }
			
		else if(id ==5){
            pl.sendForm(removerecef(),removerece)
        }

    }
}

//############################## Shop ##############################//

///////////////////////////////////////////////////////////
//                       Shop Forms                      //
///////////////////////////////////////////////////////////

function mainshopf(){
    var f = mc.newSimpleForm()
	f.setTitle('shop')
	f.setContent('choose...')
	f.addButton('出售商店')
	f.addButton('回收商店')
	return f
}
	
function chosesellf(c){
    var f = mc.newSimpleForm()
	f.setTitle('shop')
	for(var v in cfg.sell){
        if(cfg.sell[v].type == c){
            f.addButton(String(v))
        }
    }
    return f
}

function choseclassf()
{
    var f = mc.newSimpleForm()
	f.setTitle('shop')
	for (var v in cfg.listtype){
        f.addButton(cfg.listtype[String(v)])
    }
	return f
}

function choserecef(c){
    var f = mc.newSimpleForm()
	f.setTitle('shop')
	for (v in cfg.rece){
        if(cfg.rece[v].type == c){
            f.addButton(String(v))
        }
    }
    return f
}

	
function bysellf(i){
    var f = mc.newCustomForm()
	f = f.setTitle('购买商品')
	f = f.addLabel("你正在购买："+i)
	f = f.addLabel("价格："+cfg.sell[i].price)
	f = f.addInput('输入购买数量')
	return f
}

function byrecef(i){
    var f = mc.newCustomForm()
	f.setTitle('回收商品')
	f.addLabel("你正在回收："+i)
    f.addLabel("价格："+cfg.rece[i].price)
	f.addInput('输入回收数量')
	return f
}

///////////////////////////////////////////////////////////
//                       Shop Sell                       //
///////////////////////////////////////////////////////////

function bysell(pl,dt){
    if(dt!=null){
        if(isNaN(Number(dt[2])) != true){
            if(Number(dt[2]) < 1){
                pl.tell("[§cLXLShop§r] 购买的数量要大于0")
				return
            }
            if(get_money(pl) > Number(dt[2])*seeing[pl.realName].price){
                add_item(seeing[pl.realName].nbt,pl,Number(dt[2]))
				remove_money(pl,Number(dt[2])*seeing[pl.realName].price)
				pl.tell("[§cLXLShop§r] 购买成功")
            }	
			else{
                pl.tell("[§cLXLShop§r] 钱钱不够哦")
            }
				
        }
        else{
            pl.tell("[§cLXLShop§r] 输入的数据格式有误")
        }
			
    }
}
	
function chosesell(pl,dt){
    if(dt!=null){
        var c = []
		for (var v in cfg.sell){
            if(cfg.sell[v].type == seeing[pl.realName]){
                c.push(v)
            }   
        }
		var i = cfg.sell[c[dt]]
		seeing[pl.realName] = i
		pl.sendForm(bysellf(c[dt]),bysell)
    }
}
	
///////////////////////////////////////////////////////////
//                       Shop Class                      //
///////////////////////////////////////////////////////////
		
function choseclass(pl,dt){
    if(dt!=null){
        seeing[pl.realName] = cfg.listtype[Number(dt)]
		pl.sendForm(chosesellf(cfg.listtype[Number(dt)]),chosesell)
    }
}
	
///////////////////////////////////////////////////////////
//                      Shop Receive                     //
///////////////////////////////////////////////////////////


function choseclassrece(pl,dt){
    if(dt!=null){
        seeing[pl.realName] = cfg.listtype[Number(dt)]
		pl.sendForm(choserecef(cfg.listtype[Number(dt)]),choserece)
    }
}
	
function choserece(pl,dt){
    if(dt!=null){
        var c = []
		for (var v in cfg.rece){
            if(cfg.rece[v].type == seeing[pl.realName]){
                c.push(v)
            }
        }
        var i = cfg.rece[c[dt]]
        seeing[pl.realName] = i
        pl.sendForm(byrecef(c[dt]),byrece)
    }
}

function byrece(pl,dt){
    if(dt!=null){
        if(isNaN(Number(dt[2]))!= true){
            if(Number(dt[2]) < 1){
                pl.tell("[§cLXLShop§r] 回收的数量要大于0")
                return
            }
            if(count_item(pl,seeing[pl.realName])>=Number(dt[2])){
                remove_item(pl,seeing[pl.realName],Number(dt[2]))
                add_money(pl,Number(dt[2])*seeing[pl.realName].price)
                pl.tell("[§cLXLShop§r] 回收成功，获得金币"+Number(dt[2])*seeing[pl.realName].price)
            }
            else{
                pl.tell("[§cLXLShop§r] 东西不够哦，你只有"+count_item(pl,seeing[pl.realName])+"个")
            }
                
        }
        else{
            pl.tell("[§cLXLShop§r] 输入的数据格式有误")
        }
            
    }
}

///////////////////////////////////////////////////////////
//                       Shop Main                       //
///////////////////////////////////////////////////////////
	
function mainshop(pl,dt){
    if(dt!=null){
        if(Number(dt) == 0){
            pl.sendForm(choseclassf(),choseclass)
        }        
        else if (Number(dt)==1){
            pl.sendForm(choseclassf(),choseclassrece)
        }
    }
}



///////////////////////////////////////////////////////////
//                       Register                        //
///////////////////////////////////////////////////////////
		
mc.regPlayerCmd('setshop','set the shop',function (pl,a){
    pl.sendForm(mainf(),main)
},1)
mc.regPlayerCmd("shop","just a shop",function (pl,a){
    pl.sendForm(mainshopf(),mainshop)
})

log("[LXLShop] init!")
log("[LXLShop] version 1.3.0 with "+get_money_mode())



	
		
		