---@diagnostic disable: lowercase-global, undefined-global
--[[
 *
 * LXLShop
 *
 * Copyright (C) 2021 LXLDev
 *
 * This program is free software: you can redistribute it and/or modify
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
]]

dir = './plugins/LXLShop/'
if(file.exists(dir)==false)then 
	file.mkdir(dir) file.writeTo(dir..'data.json','{"sell":{},"rece":{},"listtype":[]}')
end
cfg = data.parseJson(file.readFrom(dir..'data.json'))

--0为计分板，1为LLMoney
local mode = 0

function get_money(pl)
	if(mode ==0)then
		return pl:getScore("money")
	elseif (mode ==1 ) then
		return money.get(pl.xuid)
	end
end

function add_money(pl,sc)
	if(mode==0)then
		pl:addScore('money',sc)
	elseif (mode ==1) then
		money.add(pl.xuid,sc)
	end
end

function remove_money(pl,sc)
	if(mode==0)then
		pl:setScore("money",pl:getScore("money")-sc)
	elseif (mode ==1) then
		money.reduce(pl.xuid,sc)
	end
end

function count_item(pl,it)
	local c = 0
	for k,v in pairs(pl:getInventory():getAllItems())do
		if(v.type==it)then
			c = c + v.count
		end
	end
	return c
end
function remove_item(pl,it,count)
	for k,v in pairs(pl:getInventory():getAllItems())do
		if(v.type == it)then
			print(count)
			if(v.count > count)then
				print("清除玩家"..k.."格中的物品"..count.."个")
				pl:getInventory():removeItem(k-1,count)
			else
				count = count - v.count
				pl:getInventory():removeItem(k-1,v.count)
				if(count == 0)then
					break
				end
			end
		end
	end
	pl:refreshItems()
end
local seeing = {}
--[[
{
	"sell":{
		"苹果":{
			"price":10,
			"nbt":"nbt string",
			"type":"食物"
		}
	},
	"rece":{
		"苹果":{
			"price":10,
			"nbt":"nbt string",
			"type":"食物"
		}
	},
	"listtype":["食物"]
}
]]
function save()
	file.writeTo(dir..'data.json',data.toJson(cfg))
end
function class_is_include(value)
    for k,v in pairs(cfg.listtype) do
      if v == value then
          return true
      end
    end
    return false
end
function mainf()
	local f = mc.newSimpleForm()
	f:setTitle('setshop')
	f = f:setContent('chose...')
	f = f:addButton('添加商品分类')
	f = f:addButton('添加出售商品')
	f = f:addButton('添加回收商品')
	f = f:addButton('移除商品分类')
	f = f:addButton('移除出售商品')
	f = f:addButton('移除回收商品')
	return f
end
function addclassf()
	local f =mc.newCustomForm()
	f = f:setTitle('添加商品')
	f = f:addInput('输入商品分类名称')
	return f
end
function additemf()
	local f =mc.newCustomForm()
	f = f:setTitle('添加商品')
	f = f:addInput('输入商品名称')
	f = f:addInput('输入商品价格')
	f = f:addDropdown('选择商品分类',cfg.listtype)
	return f
end
function addclass(pl,da)
	if(da~=nil)then
		if(tostring(da[1])~="")then
			if(class_is_include(tostring(da[1])))then
				pl:tell("[§cLXLShop§r] 已经有同名商品分类了！")
				return true
			end
			table.insert(cfg.listtype,tostring(da[1]))
			pl:tell('[§cLXLShop§r] 商品分类添加成功')
			save()
		else
			pl:tell("[§cLXLShop§r] 输入的数据格式有误")
		end
	end
end
function addsellitem(pl,dat)
	if(dat~=nil)and(pl:getHand():isNull() ~= true)then
		--print(data.toJson(dat))
		local it = pl:getHand():getNbt()
		if(tonumber(dat[2]) ~= nil)then
			if(tonumber(dat[2])<1)then
				pl:tell("[§cLXLShop§r] 价格要大于0!")
				return true
			end
			local t = {}
			t.price = tonumber(dat[2])
			t.nbt = it:toObject()
			t.type = cfg.listtype[dat[3]+1]
			cfg.sell[tostring(dat[1])] = t
			pl:tell('[§cLXLShop§r] 出售商品添加成功')
			save()
		else
			pl:tell("[§cLXLShop§r] 输入的数据格式有误")
		end
	end
end
function addreceitem(pl,dat)
	if(dat~=nil)and(pl:getHand():isNull() ~= true)then
		local it = pl:getHand():getNbt()
		--print(data.toJson(dat))
		if(tonumber(dat[2]) ~= nil)then
			if(tonumber(dat[2])<1)then
				pl:tell("[§cLXLShop§r] 价格要大于0!")
				return true
			end
			local t = {}
			t.price = tonumber(dat[2])
			t.nbt = it:toObject()
			t.type = cfg.listtype[dat[3]+1]
			cfg.rece[tostring(dat[1])] = t
			pl:tell('[§cLXLShop§r] 回收商品添加成功')
			save()
		else
			pl:tell("[§cLXLShop§r] 输入的数据格式有误")
		end
	end
end
function removeclassf()
	local f =mc.newCustomForm()
	f = f:setTitle('移除商品分类')
	f = f:addDropdown("选择分类",cfg.listtype)
	return f
end

--删除所有指定分类下的物品
function delclass(c)
	for k,v in pairs(cfg.rece)do
		if(v.type == c)then
			cfg.rece[k] = nil
		end
	end
	for k,v in pairs(cfg.sell)do
		if(v.type == c)then
			cfg.dell[k] = nil
		end
	end
end
function removeclass(pl,da)
	if(da~=nil)then
		delclass(cfg.listtype[da[1]+1])
		cfg.listtype[da[1]+1] = nil
		pl:tell("[§cLXLShop§r] 分类移除成功")
		save()
	end
end
function getAllSell()
	local s = {}
	for k,v in pairs(cfg.sell)do
		table.insert(s,k)
	end
	return s
end
function removesellf()
	local f =mc.newCustomForm()
	f = f:setTitle('移除出售商品')
	f = f:addDropdown("选择移除的商品",getAllSell())
	return f
end
function getAllRece()
	local s = {}
	for k,v in pairs(cfg.rece)do
		table.insert(s,k)
	end
	return s
end
function removesell(pl,dt)
	if(dt~=nil)then
		cfg.sell[getAllSell()[tonumber(dt[1])+1]] = nil
		save()
		pl:tell("[§cLXLShop§r] 出售商品移除成功")
	end
end
function removerecef()
	local f =mc.newCustomForm()
	f = f:setTitle('移除回收商品')
	f = f:addDropdown("选择移除的商品",getAllRece())
	return f
end
function removerece(pl,dt)
	if(dt~=nil)then
		cfg.rece[getAllRece()[tonumber(dt[1])+1]] = nil
		save()
		pl:tell("[§cLXLShop§r] 回收商品移除成功")
	end
end
function main(pl,id)
	if(id ~= nil)then
		id = tonumber(id)
		if(id == 0)then
			pl:sendForm(addclassf(),addclass)
		elseif(id == 1)then
			pl:sendForm(additemf(),addsellitem)
		elseif(id == 2)then
			pl:sendForm(additemf(),addreceitem)
		elseif(id == 3)then
			pl:sendForm(removeclassf(),removeclass)
		elseif(id == 4)then
			pl:sendForm(removesellf(),removesell)
		elseif(id ==5)then
			pl:sendForm(removerecef(),removerece)
		end
	end
end
function mainshopf()
	local f = mc.newSimpleForm()
	f:setTitle('shop')
	f = f:setContent('chose...')
	f = f:addButton('出售商店')
	f = f:addButton('回收商店')
	return f
end
function chosesellf(c)
	local f = mc.newSimpleForm()
	f:setTitle('shop')
	for k,v in pairs(cfg.sell)do
		if(v.type == c)then
			f:addButton(k)
		end
	end
	return f
end
function bysellf(i)
	local f = mc.newCustomForm()
	f = f:setTitle('购买商品')
	f = f:addLabel("你正在购买: "..i)
	f = f:addLabel("价格: "..cfg.sell[i].price)
	f = f:addInput('输入购买数量')
	return f
end
function bysell(pl,dt)
	if(dt~=nil)then
		if(tonumber(dt[1]) ~=nil)then
			if(tonumber(dt[1])<1)then
				pl:tell("[§cLXLShop§r] 购买的数量要大于0")
				return true
			end
			local i = mc.newItem(tostring(seeing[pl.realName].nbt.Name),tonumber(dt[1]))
			if(get_money(pl) > seeing[pl.realName].price)then
				if (pl:getInventory():hasRoomFor(i)) then
					pl:giveItem(i)
					remove_money(pl,tonumber(dt[1])*seeing[pl.realName].price)
					pl:tell("[§cLXLShop§r] 购买成功")
				else
					pl:tell("[§cLXLShop§r] 背包满了哦")
				end
			else
				pl:tell("[§cLXLShop§r] 钱钱不够哦")
			end
		else
			pl:tell("[§cLXLShop§r] 输入的数据格式有误")
		end
	end
end
function chosesell(pl,dt)
	if(dt~=nil)then
		local c = {}
		for k,v in pairs(cfg.sell)do
			if(v.type == seeing[pl.realName])then
				table.insert(c,k)
			end
		end
		local i = cfg.sell[c[dt+1]]
		seeing[pl.realName] = i
		pl:sendForm(bysellf(c[dt+1]),bysell)
	end
end
function choseclassf()
	local f = mc.newSimpleForm()
	f:setTitle('shop')
	for k,v in pairs(cfg.listtype)do
		f = f:addButton(v)
	end
	return f
end
function choseclass(pl,dt)
	if(dt~=nil)then
		seeing[pl.realName] = cfg.listtype[tonumber(dt)+1]
		pl:sendForm(chosesellf(cfg.listtype[tonumber(dt)+1]),chosesell)
	end
end
function choserecef(c)
	local f = mc.newSimpleForm()
	f:setTitle('shop')
	for k,v in pairs(cfg.rece)do
		if(v.type == c)then
			f:addButton(k)
		end
	end
	return f
end
function choseclassrece(pl,dt)
	if(dt~=nil)then
		seeing[pl.realName] = cfg.listtype[tonumber(dt)+1]
		pl:sendForm(choserecef(cfg.listtype[tonumber(dt)+1]),choserece)
	end
end
function byrecef(i)
	local f = mc.newCustomForm()
	f = f:setTitle('回收商品')
	f = f:addLabel("你正在回收: "..i)
	f = f:addLabel("价格: "..cfg.rece[i].price)
	f = f:addInput('输入回收数量')
	return f
end
function choserece(pl,dt)
	if(dt~=nil)then
		local c = {}
		for k,v in pairs(cfg.rece)do
			if(v.type == seeing[pl.realName])then
				table.insert(c,k)
			end
		end
		local i = cfg.rece[c[dt+1]]
		seeing[pl.realName] = i
		pl:sendForm(byrecef(c[dt+1]),byrece)
	end
end
function byrece(pl,dt)
	if(dt~=nil)then
		if(tonumber(dt[1]) ~=nil)then
			if(tonumber(dt[1])<1)then
				pl:tell("[§cLXLShop§r] 回收的数量要大于0")
				return true
			end
			if(count_item(pl,seeing[pl.realName].nbt.Name)>=tonumber(dt[1]))then
				remove_item(pl,seeing[pl.realName].nbt.Name,tonumber(dt[1]))
				add_money(pl,tonumber(dt[1])*seeing[pl.realName].price)
				pl:tell("[§cLXLShop§r] 回收成功，获得金币"..tonumber(dt[1])*seeing[pl.realName].price)
			else
				pl:tell("[§cLXLShop§r] 东西不够哦，你只有"..count_item(pl,seeing[pl.realName].nbt.Name).."个")
			end
		else
			pl:tell("[§cLXLShop§r] 输入的数据格式有误")
		end
	end
end
function mainshop(pl,dt)
	if(dt~=nil)then
		if(tonumber(dt) == 0)then
			pl:sendForm(choseclassf(),choseclass)
		elseif (tonumber(dt)==1) then
			pl:sendForm(choseclassf(),choseclassrece)
		end
	end
end
mc.regPlayerCmd('setshop','set the shop',function (pl,a)
	pl:sendForm(mainf(),main)
end
,1)
mc.regPlayerCmd("shop","just a shop",function (pl,a)
	pl:sendForm(mainshopf(),mainshop)
end)

log("[LXLShop] init!")
log("[LXLShop] version 1.1.3")