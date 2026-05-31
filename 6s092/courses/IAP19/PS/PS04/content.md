# Readings 
[Recitation 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_r01/) on OCW, Section on Algorithms (originally, Recitation notes 1 from Fall 2018)

Lecture notes [1: Introduction](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec1/), [2: Data Structures](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec2/) on OCW (originally, Lecture notes 1, 2 from Fall 2018)

[Lecture 1: Introduction](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_lec1/) on OCW (originally, "OCW algorithmic thinking" from Fall 2011 Lecture 1)

# Algorithmic thinking


<question multiplechoice>
csq_prompt = "Which of the following are algorithms (under the Word-RAM model of computation)?"
csq_renderer = "checkbox"
csq_soln = [1,0,1,0,1]
csq_options =  ['Always return True',
'What is the shortest path between points A and B?',
'Add the input numbers together and then divide by the number of input numbers',
'A sorted binary tree',
'Generate a random number, 0 or 1, with 50% chance. If you generated 0, return True, if not return False']
csq_name="qexample1"
</question>


<checkyourself>
You should have a clear understanding of what is an algorithm. An algorithm is a series of unambiguous instructions mapping an input to an output.
</checkyourself>


## Understanding a simple algorithm

We have the following problem: given an one-dimensional array, we want to find a peak, i.e. an element that is larger or equal to its neighbors. 

<checkyourself>
Does a peak always exist?

<showhide>
Yes. Because the peak can also be equal to its neighbors, a peak will always exist in a non-empty array.
</showhide>
</checkyourself>

<question multiplechoice>
csq_prompt = """
A brute-force algorithm is a general problem-solving technique which enumerates all possibilities and checks whether they are a solution to the problem. A straightforward, brute-force algorithm for this problem is as follows: \n
\n
Iterate over the array, and check whether each element is a peak by checking it against both of its neighbors. \n
What is the runtime of this algorithm?
"""

csq_renderer = "radio"
csq_soln = 'O(n)'
csq_options =  ['O(n^2)',
'O(n)',
'O(log n)',
'O(1)']
csq_name="peakfinding"
</question>

We can get a faster algorithm using a divide-and-conquer approach as follows:

Check the middle element of the array and compare it to its neighbors. If it is a peak, then we are done. If it is not a peak, than either its left neighbor is greater than it, or its right neighbor is greater than it. If its left neighbor is greater, recurse on the left half of the array. Otherwise, recurse on the right half.

<checkyourself>
Try to explain why this algorithm always works.

<showhide>
We start with an array that has a peak. We want to show that our recursive step always preserves this invariant. If the left neighbor is greater than the middle element, then the global maximum of the left side must be a peak. Thus, the subarray that we are recursing on must have a peak.
</showhide>
</checkyourself>

<question multiplechoice>
csq_prompt = "What is the runtime of this algorithm?"

csq_renderer = "radio"
csq_soln = 'O(log n)'
csq_options =  ['O(n^2)',
'O(n)',
'O(log n)',
'O(1)']
csq_name="peakfinding2"
</question>
## Other relevant problems / further reading

- [OCW 6.006 Spring 2020 — Practice Problems](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/practice-problems/): problem sessions with worked examples and solutions.
  Most relevant: [Problem Session 1](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/problem-session-1/) — asymptotic behavior of functions and double-ended sequence operations.
- OCW 6.006 Spring 2020 — [Problem Set 1 Questions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-questions/) | [Solutions](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/mit6_006s20_ps1-solutions/): asymptotic ordering of functions, data structures, and doubly linked lists
- [OCW 6.006 Spring 2020 — Lecture Notes](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/pages/lecture-notes/)
