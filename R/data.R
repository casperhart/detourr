#' Embeddings of images in the MNIST test set
#'
#' @description
#' Two datasets are available; `mnist_embeddings_8d` contains 8-dimensional
#' embedding vectors and `mnist_embeddings_32d` contains 32-dimensional
#' embedding vectors.
#'
#' The neural network that produced these embeddings was created using
#' TensorFlow (Abadi et al. (2016)) with a variation of the code found in this example:
#' https://www.tensorflow.org/addons/tutorials/losses_triplet
#'
#' @details A data frame with 10,000 rows and p variables:
#' - id: sequential ID or row number of the image
#' - label: the digit 0, 1, ..., 9
#' - X1--Xp: elements 1--p of the embedding vector
#'
#' @references
#' LeCun, Y (1998). The MNIST database of handwritten digits.
#' http://yann.lecun.com/exdb/mnist/.
#'
#' Abadi, M, P Barham, J Chen, Z Chen, A Davis, J Dean, M Devin, S Ghemawat, G Irving,
#' M Isard, et al. (2016). {TensorFlow}: A System for {Large-Scale} Machine Learning.
#' In: 12th USENIX symposium on operating systems design and implementation (OSDI 16),
#' pp.265–283.

#' @name mnist_embeddings
"mnist_embeddings_32d"

#' @rdname mnist_embeddings
"mnist_embeddings_8d"
