-- SAMPLE DATA. Edit or delete from the admin dashboard.
insert into public.categories (name, slug, sort_order) values
 ('Signature Plates','signature',10),('European Classics','european',20),('Arabic Favourites','arabic',30),
 ('Starters & Mezze','mezze',40),('Desserts & Coffee','desserts',50),('Beverages','beverages',60) on conflict do nothing;
insert into public.menu_items (category_id, name, description, price, is_veg, is_bestseller, is_new, spice_level, allergens, sort_order)
select c.id, v.n, v.d, v.p, v.veg, v.b, v.nw, v.s, v.a, v.o from (values
 ('signature','Herb Crusted Lamb Chops','Saffron rice, grilled vegetables, rosemary jus.',78,false,true,false,0,'{Dairy}'::text[],10),
 ('signature','Mediterranean Seabass','Olive oil, herbs, citrus, seasonal vegetables.',68,false,false,true,0,'{Fish}',20),
 ('european','Grilled Ribeye','Charcoal grilled, pepper sauce, fries.',95,false,false,false,0,'{Dairy}',10),
 ('european','Wild Mushroom Pasta','Tagliatelle, cream, thyme, parmesan.',52,true,false,false,0,'{Gluten,Dairy}',20),
 ('mezze','Classic Hummus','Chickpeas, tahini, olive oil, lemon, warm pita.',32,true,true,false,0,'{Sesame,Gluten}',10),
 ('mezze','Fattoush','Crisp greens, sumac, pomegranate, toasted pita.',30,true,false,false,0,'{}',20),
 ('arabic','Mixed Grill','Lamb kofta, shish tawook, beef skewers.',84,false,true,false,1,'{}',10),
 ('desserts','Pistachio Baklava','Layers of filo, pistachio, honey.',28,true,false,false,0,'{Nuts,Gluten}',10),
 ('beverages','Saffron Karak','Slow brewed tea, saffron, cardamom.',14,true,false,false,0,'{}',10)
) as v(cs,n,d,p,veg,b,nw,s,a,o) join public.categories c on c.slug = v.cs;
insert into public.hero_slides (heading, subtitle, cta_text, link_section, sort_order) values
 ('A Meeting of Two Culinary Worlds','European finesse. Arabic soul.','Explore the Menu','menu',10),
 ('A Little More to Love','Discover our latest dining offers.','Explore Offers','offers',20);
insert into public.hero_slides (heading, subtitle, cta_text, category_id, sort_order)
select 'End on a Golden Note','Discover something delicious.','Explore Desserts', id, 30 from public.categories where slug='desserts';
insert into public.offers (title, description, discount_label, sort_order) values
 ('A Little More to Love','Sample offer. Edit in admin.','10% off your order',10),('Golden Hour','Sweeten your evening.',null,20);
insert into public.daily_specials (item_id, special_date, promo_text)
select id, (now() at time zone 'Asia/Dubai')::date, 'Chef''s pick today' from public.menu_items where name='Herb Crusted Lamb Chops';
