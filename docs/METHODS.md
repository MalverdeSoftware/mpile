# Analysis and reconciliation

## Background

Pile sorting, also called card sorting, has its roots in anthropology. Each person sorts a set of items into groups of things that go together (Weller & Romney, 1988; Yeh et al., 2013). mPile uses the unconstrained form: participants decide how many piles to make and what each one means (Burton, 1975; Coxon, 1999). Card sorting is also widely used in knowledge elicitation and human–computer interaction (Rugg & McGeorge, 2005; Tchivi et al., 2025). Part of its appeal is that it works in the participants' own terms rather than the researcher's (Fincher & Tenenberg, 2005).

Pile sorts have been used with Navajo teenagers to understand drug and AIDS risks (Trotter & Potter, 1993), to check focus group findings with urban youth (Stanton et al., 1993), and to explore barriers to cancer screening in American Indian communities, with cards drawn from free lists by community leaders and providers (Yeh et al., 2013). Group concept mapping builds on the same sorting task and has been used as a participatory public health method (Burke et al., 2005; Kane & Trochim, 2007; Trochim, 1989), including with American Indian and First Nation young adults (Kading et al., 2019) and with Indigenous scholars (O’Keefe et al., 2023).

## Stable card identity

A pile is a participant's grouping, not a predetermined category. Pile names and explanations are retained verbatim. Identical names across participants do not prove identical meaning; different names do not prove different meaning.

Shared cards have stable IDs. For each submitted sorting response, the app records one pile ID or an unsorted value per card. Generated cards have their own IDs and remain in that response's qualitative record. They are not matched by text to other participants' additions.

The collect-review-sort workflow, which the current app does not include, establishes a common card set before sorting. Each published card can retain `response_id:original_card_id` source references. Original contributions remain in the archive. The researcher decides which meanings should be combined; the app offers only exact-text duplicate combination.

## Pairwise similarity

Sorting data are usually analyzed by counting, for each pair of items, how often they were put in the same pile (Coxon, 1999; Weller & Romney, 1988; Yeh et al., 2013). There is more than one way to turn those counts into a similarity or distance. Some measures adjust for the size of the piles (Burton, 1975). mPile uses the following one.

For distinct shared cards i and j:

- `together(i,j)`: number of submitted, current-revision sorts putting both cards in the same pile.
- `compared(i,j)`: number of submitted, current-revision sorts assigning both cards to any pile.
- `similarity(i,j) = together(i,j) / compared(i,j)` when the denominator is positive.
- When the denominator is zero, similarity is missing (`null` in JSON, blank in CSV, dash in the matrix).

Drafts, collection-stage responses, and responses from older card revisions are excluded. An unsorted card is treated as missing for comparisons involving it. Unsorted cards are not a shared pile and are not treated as deliberate separation. The matrix diagonal is not estimated.

For example, if three participants put A with B, two separate A and B, and one leaves B unsorted, similarity is 3/5 = 0.6. All six are counted as submitted sorts, but only five enter that pair's denominator.

This choice prioritizes explicit assignments. It may introduce missingness bias when unsorted cards are systematic rather than accidental. Inspect per-pair sample sizes and the original responses.

## Connection map

Each shared card is a node, numbered against the card legend. Edges display pairs above a configurable similarity threshold and minimum comparable-response count. Line thickness encodes similarity. The layout is circular; node distance and position have **no statistical meaning**.

It is not multidimensional scaling (MDS). MDS is the traditional way to picture sorting data and is the basis of concept mapping (DeJordy et al., 2007; Kane & Trochim, 2007; Van der Kloot & Van Herk, 1991). Graph layouts are an alternative that can communicate structure better when the data don't fit MDS's assumptions (DeJordy et al., 2007). The connection map is a simpler display than either: it shows which pairs pass the threshold, not where cards sit in a space. Researchers who want MDS can run it on the exported similarity file.

## Hierarchical clustering

The app uses unweighted average linkage over original cross-cluster card-pair distances, with dissimilarity `1 - similarity`. At each step, it joins the two clusters with the smallest mean cross-cluster distance. Ties follow stable input/cluster order.

Clustering is withheld if any distinct card pair is missing. The app does not impute missing pairs as zero similarity. Branch height represents dissimilarity. The result is descriptive and exploratory; it is not a significance test, cultural consensus estimate, or automatic reconciliation of participant-defined meanings.

Hierarchical clustering is a common step in analyzing sorts (Kane & Trochim, 2007; Yeh et al., 2013). A single tree can hide ways of sorting that only some participants used (Rosenberg & Park Kim, 1975). Read it alongside the matrix and the participants' own pile names. The cultural consensus model, which estimates each person's knowledge of a shared cultural domain along with the group's answers, is a separate analysis that mPile does not run (Romney et al., 1986).

## Collecting sorts online

mPile collects sorts on participants' own phones and computers, not face to face. In a randomized comparison, pile sorts collected online and face to face showed the same semantic structure, but how much participants agreed with each other differed by mode depending on how many items they sorted (Gravlee et al., 2017). Online sessions can make some participants more comfortable. They can also be harder for people on phones and tablets, and for people with vision difficulties (Ackley et al., 2023). Keep the number of cards in mind and rehearse on the devices your participants will use. For how many participants to recruit, see Lantz et al. (2019).

## Recommended reconciliation workflow

1. Preserve the original response archive.
2. Inspect pairwise similarity together with its denominators.
3. Review participant pile labels and explanations alongside the quantitative patterns.
4. If a unified category scheme is useful, document a researcher/community-reviewed category crosswalk separately. Keep the original labels and disagreements visible. In concept mapping with Indigenous communities, community members have taken part in interpreting the results (Kading et al., 2019). Who reviews and uses the results is a governance question for the community and its partners (Carroll et al., 2020).
5. Report card selection, instructions, missing-card treatment, and analytic choices with the study.

The implementation is checked against deterministic fixtures covering pair-specific missingness, excluded drafts/revisions, and average-linkage merges. No claim of numerical equivalence with Anthropac (Borgatti, 1990) is made.

## References

Ackley, C., Rodriguez, D. G., & Villa, G. (2023). “I didn’t Notice that You Were Watching Me”: Exploring a User Acceptance Study to Conduct Cultural Domain Analysis Online During the COVID-19 Pandemic. *International Journal of Qualitative Methods*, *22*. https://doi.org/10.1177/16094069231164602

Borgatti, S. (1990). Using ANTHROPAC To Investigate a Cultural Domain. *CAM Newsletter*, *2*(1), 8. https://doi.org/10.1177/1525822x9000200106

Burke, J. G., O’Campo, P., Peak, G. L., Gielen, A. C., McDonnell, K. A., & Trochim, W. M. K. (2005). An Introduction to Concept Mapping as a Participatory Public Health Research Method. *Qualitative Health Research*, *15*(10), 1392–1410. https://doi.org/10.1177/1049732305278876

Burton, M. L. (1975). Dissimilarity Measures For Unconstrained Sorting Data. *Multivariate Behavioral Research*, *10*(4), 409–423. https://doi.org/10.1207/s15327906mbr1004_2

Carroll, S. R., Garba, I., Figueroa-Rodríguez, O. L., Holbrook, J., Lovett, R., Materechera, S., Parsons, M., Raseroka, K., Rodriguez-Lonebear, D., Rowe, R., Sara, R., Walker, J. D., Anderson, J., & Hudson, M. (2020). The CARE Principles for Indigenous Data Governance. *Data Science Journal*, *19*. https://doi.org/10.5334/dsj-2020-043

Coxon, A. (1999). *Sorting Data*. SAGE Publications, Inc. https://doi.org/10.4135/9781412985871

DeJordy, R., Borgatti, S. P., Roussin, C., & Halgin, D. S. (2007). Visualizing Proximity Data. *Field Methods*, *19*(3), 239–263. https://doi.org/10.1177/1525822x07302104

Fincher, S., & Tenenberg, J. (2005). Making sense of card sorting data. *Expert Systems*, *22*(3), 89–93. https://doi.org/10.1111/j.1468-0394.2005.00299.x

Gravlee, C. C., Maxwell, C. R., Jacobsohn, A., & Bernard, H. R. (2017). Mode effects in cultural domain analysis: comparing pile sort data collected via internet versus face-to-face interviews. *International Journal of Social Research Methodology*, *21*(2), 165–176. https://doi.org/10.1080/13645579.2017.1341187

Kading, M. L., Gonzalez, M. B., Herman, K. A., Gonzalez, J., & Walls, M. L. (2019). Living a Good Way of Life: Perspectives from American Indian and First Nation Young Adults. *American Journal of Community Psychology*, *64*(1-2), 21–33. https://doi.org/10.1002/ajcp.12372

Kane, M., & Trochim, W. (2007). *Concept Mapping for Planning and Evaluation*. SAGE Publications, Inc. https://doi.org/10.4135/9781412983730

Lantz, E., Keeley, J. W., Roberts, M. C., Medina-Mora, M. E., Sharan, P., & Reed, G. M. (2019). Card Sorting Data Collection Methodology: How Many Participants Is Most Efficient? *Journal of Classification*, *36*(3), 649–658. https://doi.org/10.1007/s00357-018-9292-8

O’Keefe, V. M., Maudrie, T. L., Cole, A. B., Ullrich, J. S., Fish, J., Hill, K. X., White, L. A., Redvers, N., Jernigan, V. B. B., Lewis, J. P., West, A. E., Apok, C. A., White, E. J., Ivanich, J. D., Schultz, K., Lewis, M. E., Sarche, M. C., Gonzalez, M. B., Parker, M., . . . Walls, M. L. (2023). Conceptualizing Indigenous strengths-based health and wellness research using group concept mapping. *Archives of Public Health*, *81*(1). https://doi.org/10.1186/s13690-023-01066-7

Romney, A. K., Weller, S. C., & Batchelder, W. H. (1986). Culture as Consensus: A Theory of Culture and Informant Accuracy. *American Anthropologist*, *88*(2), 313–338. https://doi.org/10.1525/aa.1986.88.2.02a00020

Rosenberg, S., & Park Kim, M. (1975). The Method of Sorting as a Data-Gathering Procedure in Multivariate Research. *Multivariate Behavioral Research*, *10*(4), 489–502. https://doi.org/10.1207/s15327906mbr1004_7

Rugg, G., & McGeorge, P. (2005). The sorting techniques: a tutorial paper on card sorts, picture sorts and item sorts. *Expert Systems*, *22*(3), 94–107. https://doi.org/10.1111/j.1468-0394.2005.00300.x

Stanton, B. F., Aronson, R., Borgatti, S., Galbraith, J., Feigelman, S., & The AIDS Youth Research Team. (1993). Urban Adolescent High-Risk Sexual Behavior: Corroboration of Focus Group Discussions Through Pile-Sorting. *AIDS Education and Prevention*, *5*(2), 162–174. https://doi.org/10.1521/aeap.1993.5.2.162

Tchivi, E., Sharma, B., & Paea, S. (2025). A Systematic Review of the Comparison of Different Types of Card Sorting. *IEEE Access*, *13*, 52334–52352. https://doi.org/10.1109/access.2025.3552949

Trochim, W. M. (1989). An introduction to concept mapping for planning and evaluation. *Evaluation and Program Planning*, *12*(1), 1–16. https://doi.org/10.1016/0149-7189(89)90016-5

Trotter, R. T., & Potter, J. M. (1993). Pile Sorts, A Cognitive Anthropological Model of Drug and AIDS Risks for Navajo Teenagers: Assessment of a New Evaluation Tool. *Drugs & Society*, *7*(3-4), 23–39. https://doi.org/10.1300/j023v07n03_03

Van der Kloot, W. A., & Van Herk, H. (1991). Multidimensional Scaling of Sorting Data: A Comparison of Three Procedures. *Multivariate Behavioral Research*, *26*(4), 563–581. https://doi.org/10.1207/s15327906mbr2604_1

Weller, S., & Romney, A. (1988). *Systematic Data Collection*. SAGE Publications, Inc. https://doi.org/10.4135/9781412986069

Yeh, H.-W., Gajewski, B. J., Perdue, D. G., Cully, A., Cully, L., Greiner, K. A., Choi, W. S., & Daley, C. M. (2013). Sorting it out: pile sorting as a mixed methodology for exploring barriers to cancer screening. *Quality & Quantity*, *48*(5), 2569–2587. https://doi.org/10.1007/s11135-013-9908-3
