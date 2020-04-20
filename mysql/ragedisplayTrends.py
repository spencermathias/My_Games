# -*- coding: utf-8 -*-
"""
Created on Mon Apr 20 11:35:10 2020

@author: Spencer
"""

import matplotlib.pyplot as plt
import databaseLogin as login


#retrive data from database
mydb=login.mysqlconnect()

#get propriate columbs using sql query
sql="SELECT game_id, Total_bid, hand_Size FROM data_per_round"
mycursor = mydb.cursor()
mycursor.execute(sql)
myresult = mycursor.fetchall()

#arrange the data by game
numberOfGames=myresult[-1][0]+1
handsize=[[] for i in range(numberOfGames)]
totalbid=[[] for i in range(numberOfGames)]
allhand=[]
allbid=[]
for x in myresult:
    totalbid[x[0]].append(x[1])
    handsize[x[0]].append(x[2])
    allhand.append([x[2]])
    allbid.append([x[1]])
for i, games in enumerate(totalbid):
    plt.plot(handsize[i],games)

#plot with greatest number of cards in hand first just like in play
ax = plt.gca()
ax.invert_xaxis()
plt.show()

# show the difference in the bid to the number of cards avalible
plt.Figure()
alldiffer=[]
allhands=[]
allbids=[]
for i, games in enumerate(totalbid):
    differ=[]
    for j, bids in enumerate(games):
        dif=handsize[i][j]-bids
        differ.append(dif)
        allhands.append(handsize[i][j])
        allbids.append(bids)
        alldiffer.append(dif)
    plt.plot(handsize[i],differ,'.')
ax = plt.gca()
ax.invert_xaxis()
plt.show()
plt.figure()

# plot to see general trends
# =============================================================================
# plt.plot(allhands,alldiffer,'.')
# ax = plt.gca()
# ax.invert_xaxis()
# =============================================================================
